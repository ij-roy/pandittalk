package expo.modules.panditchime

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import androidx.core.os.bundleOf
import com.amazonaws.services.chime.sdk.meetings.audiovideo.AudioVideoConfiguration
import com.amazonaws.services.chime.sdk.meetings.audiovideo.AudioVideoFacade
import com.amazonaws.services.chime.sdk.meetings.audiovideo.audio.AudioMode
import com.amazonaws.services.chime.sdk.meetings.audiovideo.audio.AudioStreamType
import com.amazonaws.services.chime.sdk.meetings.device.MediaDeviceType
import com.amazonaws.services.chime.sdk.meetings.session.DefaultMeetingSession
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSession
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSessionConfiguration
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSessionCredentials
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSessionURLs
import com.amazonaws.services.chime.sdk.meetings.session.defaultUrlRewriter
import com.amazonaws.services.chime.sdk.meetings.utils.logger.ConsoleLogger
import com.amazonaws.services.chime.sdk.meetings.utils.logger.LogLevel
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeout

class ExpoPanditChimeModule : Module() {
  private val logger = ConsoleLogger(LogLevel.WARN)
  private val mainHandler = Handler(Looper.getMainLooper())
  private val retryRunnables = mutableListOf<Runnable>()

  private var meetingSession: MeetingSession? = null
  private var audioObserver: MeetingAudioObserver? = null
  private var deviceObserver: MeetingDeviceObserver? = null
  private var realtimeObserver: MeetingRealtimeObserver? = null
  private var videoTileObserver: MeetingVideoTileObserver? = null
  private var startDeferred: CompletableDeferred<Unit>? = null
  private var speakerOn = true
  private var cameraOn = true
  private var withVideo = false
  private var localAttendeeId: String? = null
  private var sessionMediaActive = false
  private var userMuted = false
  private val remoteAttendeeIds = mutableSetOf<String>()
  private var savedVoiceCallVolume: Int? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoPanditChime")

    Events(
      "onMeetingStart",
      "onMeetingEnd",
      "onError",
      "onRemoteVolumeChanged",
      "onLocalSignalChanged",
      "onVideoTileAdded",
      "onVideoTileRemoved",
    )

    View(ExpoPanditChimeVideoView::class) {
      Prop("tileId") { view: ExpoPanditChimeVideoView, tileId: Int ->
        view.setTileId(tileId)
      }
      Prop("mirror") { view: ExpoPanditChimeVideoView, mirror: Boolean ->
        view.setMirror(mirror)
      }
    }

    AsyncFunction("startMeeting") Coroutine { meeting: ChimeMeetingRecord, attendee: ChimeAttendeeRecord ->
      startMeetingInternal(meeting, attendee, withVideo = false)
    }

    AsyncFunction("startVideoMeeting") Coroutine { meeting: ChimeMeetingRecord, attendee: ChimeAttendeeRecord ->
      startMeetingInternal(meeting, attendee, withVideo = true)
    }

    AsyncFunction("stopMeeting") {
      stopMeetingInternal()
    }

    Function("setMuted") { muted: Boolean ->
      val audioVideo = meetingSession?.audioVideo ?: return@Function false
      val ok = if (muted) audioVideo.realtimeLocalMute() else audioVideo.realtimeLocalUnmute()
      if (ok) userMuted = muted
      ok
    }

    Function("enterWaitingRoomMode") {
      sessionMediaActive = false
      val audioVideo = meetingSession?.audioVideo
      if (audioVideo == null) return@Function null
      audioVideo.realtimeLocalMute()
      if (withVideo) {
        try {
          audioVideo.stopRemoteVideo()
        } catch (_: Exception) {
          // ignore if remote video was not started
        }
      }
      muteAllRemoteAttendees()
      null
    }

    Function("enableSessionMedia") {
      sessionMediaActive = true
      val audioVideo = meetingSession?.audioVideo
      if (audioVideo == null) return@Function null
      if (!userMuted) {
        audioVideo.realtimeLocalUnmute()
      }
      if (withVideo) {
        audioVideo.startRemoteVideo()
      }
      unmuteAllRemoteAttendees()
      null
    }

    Function("setRemoteAudioEnabled") { enabled: Boolean ->
      if (meetingSession?.audioVideo == null) return@Function null
      if (enabled) {
        unmuteAllRemoteAttendees()
      } else {
        muteAllRemoteAttendees()
      }
      null
    }

    Function("setSpeakerOn") { on: Boolean ->
      speakerOn = on
      ChimeSessionHolder.setSpeakerOn(on)
      val audioVideo = meetingSession?.audioVideo
      if (audioVideo == null) return@Function
      chooseAudioDevice(audioVideo, on)
    }

    Function("setCameraOn") { on: Boolean ->
      cameraOn = on
      ChimeSessionHolder.setCameraOn(on)
      val audioVideo = meetingSession?.audioVideo
      if (audioVideo == null) return@Function
      if (on) {
        audioVideo.startLocalVideo()
      } else {
        audioVideo.stopLocalVideo()
      }
    }

    Function("flipCamera") {
      meetingSession?.audioVideo?.switchCamera()
    }

    Function("resumeForegroundMedia") {
      val audioVideo = meetingSession?.audioVideo ?: return@Function null
      ChimeSessionHolder.notifyTilesChanged()
      applySpeakerRouting(audioVideo)
      if (sessionMediaActive) {
        if (userMuted) audioVideo.realtimeLocalMute() else audioVideo.realtimeLocalUnmute()
        if (withVideo) {
          audioVideo.startRemoteVideo()
          if (cameraOn) audioVideo.startLocalVideo()
        }
      } else {
        audioVideo.realtimeLocalMute()
      }
      null
    }
  }

  private fun muteAllRemoteAttendees() {
    setRemoteAudioPlaybackEnabled(false)
  }

  private fun unmuteAllRemoteAttendees() {
    setRemoteAudioPlaybackEnabled(true)
  }

  private fun setRemoteAudioPlaybackEnabled(enabled: Boolean) {
    val context = appContext.reactContext ?: return
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val stream = AudioManager.STREAM_VOICE_CALL

    if (!enabled) {
      if (savedVoiceCallVolume == null) {
        savedVoiceCallVolume = audioManager.getStreamVolume(stream)
      }
      audioManager.setStreamVolume(stream, 0, 0)
      return
    }

    savedVoiceCallVolume?.let { volume ->
      audioManager.setStreamVolume(stream, volume, 0)
    }
    savedVoiceCallVolume = null
  }

  private fun chooseAudioDevice(audioVideo: AudioVideoFacade, useSpeaker: Boolean): Boolean {
    val devices = audioVideo.listAudioDevices().filter { it.type != MediaDeviceType.OTHER }
    if (devices.isEmpty()) return false

    val preferredType = if (useSpeaker) {
      MediaDeviceType.AUDIO_BUILTIN_SPEAKER
    } else {
      MediaDeviceType.AUDIO_HANDSET
    }

    val device = devices.firstOrNull { it.type == preferredType } ?: devices.first()
    audioVideo.chooseAudioDevice(device)
    return true
  }

  private fun applySpeakerRouting(audioVideo: AudioVideoFacade) {
    chooseAudioDevice(audioVideo, speakerOn)
    scheduleAudioDeviceRetries(audioVideo)
  }

  private fun scheduleAudioDeviceRetries(audioVideo: AudioVideoFacade) {
    clearRetryRunnables()
    for (delayMs in listOf(300L, 1000L)) {
      val runnable = Runnable {
        if (meetingSession != null) {
          chooseAudioDevice(audioVideo, speakerOn)
        }
      }
      retryRunnables.add(runnable)
      mainHandler.postDelayed(runnable, delayMs)
    }
  }

  private fun clearRetryRunnables() {
    retryRunnables.forEach { mainHandler.removeCallbacks(it) }
    retryRunnables.clear()
  }

  private suspend fun startMeetingInternal(
    meeting: ChimeMeetingRecord,
    attendee: ChimeAttendeeRecord,
    withVideo: Boolean,
  ) {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    stopMeetingInternal()
    speakerOn = true
    cameraOn = true
    sessionMediaActive = false
    userMuted = false
    remoteAttendeeIds.clear()
    this.withVideo = withVideo
    ChimeSessionHolder.setSpeakerOn(true)
    ChimeSessionHolder.setCameraOn(true)
    setKeepScreenOn(withVideo)

    val meetingId = meeting.MeetingId?.takeIf { it.isNotBlank() }
      ?: throw CodedException("Chime meeting is missing MeetingId")
    val attendeeId = attendee.AttendeeId?.takeIf { it.isNotBlank() }
      ?: throw CodedException("Chime attendee is missing AttendeeId")
    val joinToken = attendee.JoinToken?.takeIf { it.isNotBlank() }
      ?: throw CodedException("Chime attendee is missing JoinToken")

    localAttendeeId = attendeeId

    val placement = meeting.MediaPlacement
    val sessionConfig = MeetingSessionConfiguration(
      meetingId,
      MeetingSessionCredentials(
        attendeeId,
        attendee.ExternalUserId ?: "",
        joinToken,
      ),
      MeetingSessionURLs(
        placement?.AudioFallbackUrl ?: "",
        placement?.AudioHostUrl ?: "",
        placement?.TurnControlUrl ?: "",
        placement?.SignalingUrl ?: "",
        ::defaultUrlRewriter,
      ),
    )

    val session = DefaultMeetingSession(sessionConfig, logger, context)
    meetingSession = session
    ChimeSessionHolder.setSession(session, attendeeId)

    val deferred = CompletableDeferred<Unit>()
    startDeferred = deferred

    val observer = MeetingAudioObserver(
      onStarted = { reconnecting ->
        if (!reconnecting) {
          applySpeakerRouting(session.audioVideo)
          if (withVideo) {
            session.audioVideo.startLocalVideo()
          }
          session.audioVideo.realtimeLocalMute()
          deferred.complete(Unit)
          ChimeSessionHolder.notifySessionStarted()
          sendEvent("onMeetingStart", bundleOf())
        }
      },
      onStopped = {
        sendEvent("onMeetingEnd", bundleOf())
      },
    )
    audioObserver = observer

    val deviceChangeObserver = MeetingDeviceObserver {
      session.audioVideo.let { av -> chooseAudioDevice(av, speakerOn) }
    }
    deviceObserver = deviceChangeObserver

    val realtime = MeetingRealtimeObserver(
      attendeeId,
      onRemoteVolume = { remoteAttendeeId, volume, muted ->
        if (remoteAttendeeId != attendeeId) {
          remoteAttendeeIds.add(remoteAttendeeId)
          if (!sessionMediaActive) {
            setRemoteAudioPlaybackEnabled(false)
          }
        }
        if (sessionMediaActive) {
          sendEvent(
            "onRemoteVolumeChanged",
            bundleOf(
              "attendeeId" to remoteAttendeeId,
              "volume" to volume,
              "muted" to muted,
            ),
          )
        }
      },
      onLocalSignal = { level ->
        sendEvent("onLocalSignalChanged", bundleOf("level" to level))
      },
    )
    realtimeObserver = realtime

    val audioVideo: AudioVideoFacade = session.audioVideo
    audioVideo.addAudioVideoObserver(observer)
    audioVideo.addDeviceChangeObserver(deviceChangeObserver)
    audioVideo.addRealtimeObserver(realtime)

    if (withVideo) {
      val videoObserver = MeetingVideoTileObserver(
        onTileAdded = { tileState ->
          sendEvent(
            "onVideoTileAdded",
            bundleOf(
              "tileId" to tileState.tileId,
              "attendeeId" to tileState.attendeeId,
              "isLocal" to tileState.isLocalTile,
              "isContent" to tileState.isContent,
            ),
          )
        },
        onTileRemoved = { tileState ->
          sendEvent(
            "onVideoTileRemoved",
            bundleOf(
              "tileId" to tileState.tileId,
              "attendeeId" to tileState.attendeeId,
              "isLocal" to tileState.isLocalTile,
              "isContent" to tileState.isContent,
            ),
          )
        },
      )
      videoTileObserver = videoObserver
      audioVideo.addVideoTileObserver(videoObserver)
    }

    val audioVideoConfig = AudioVideoConfiguration(
      audioMode = AudioMode.Mono16K,
      audioStreamType = AudioStreamType.VoiceCall,
    )

    val errorLabel = if (withVideo) "Chime video" else "Chime audio"

    try {
      audioVideo.start(audioVideoConfig)
      withTimeout(30_000) {
        deferred.await()
      }
    } catch (error: Exception) {
      stopMeetingInternal()
      sendEvent("onError", bundleOf("message" to (error.message ?: "Failed to start $errorLabel")))
      throw CodedException(error.message ?: "Failed to start $errorLabel session")
    }
  }

  private fun stopMeetingInternal() {
    clearRetryRunnables()
    startDeferred?.cancel()
    startDeferred = null
    setKeepScreenOn(false)

    setRemoteAudioPlaybackEnabled(true)

    meetingSession?.audioVideo?.let { audioVideo ->
      if (withVideo) {
        if (cameraOn) {
          try {
            audioVideo.stopLocalVideo()
          } catch (_: Exception) {
            // ignore cleanup errors
          }
        }
        videoTileObserver?.let { audioVideo.removeVideoTileObserver(it) }
      }
      audioObserver?.let { audioVideo.removeAudioVideoObserver(it) }
      deviceObserver?.let { audioVideo.removeDeviceChangeObserver(it) }
      realtimeObserver?.let { audioVideo.removeRealtimeObserver(it) }
      audioVideo.stop()
    }

    ChimeSessionHolder.clear()

    meetingSession = null
    audioObserver = null
    deviceObserver = null
    realtimeObserver = null
    videoTileObserver = null
    localAttendeeId = null
    withVideo = false
    cameraOn = true
    sessionMediaActive = false
    userMuted = false
    remoteAttendeeIds.clear()
    savedVoiceCallVolume = null
  }

  /**
   * Video keeps the screen on. Voice calls leave the screen free to dim.
   * Window FLAG_KEEP_SCREEN_ON is the reliable Activity-level lock for video.
   */
  private fun setKeepScreenOn(enabled: Boolean) {
    val activity = appContext.currentActivity ?: return
    mainHandler.post {
      val window = activity.window ?: return@post
      if (enabled) {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }
}
