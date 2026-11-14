package expo.modules.panditchime

import com.amazonaws.services.chime.sdk.meetings.audiovideo.AudioVideoFacade
import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.VideoRenderView
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSession
import java.lang.ref.WeakReference

object ChimeSessionHolder {
  var meetingSession: MeetingSession? = null
    private set

  var audioVideo: AudioVideoFacade? = null
    private set

  var localAttendeeId: String? = null
    private set

  var cameraOn: Boolean = true
    private set

  var speakerOn: Boolean = true
    private set

  private val videoViews = mutableListOf<WeakReference<ExpoPanditChimeVideoView>>()

  fun setSession(session: MeetingSession, attendeeId: String) {
    meetingSession = session
    audioVideo = session.audioVideo
    localAttendeeId = attendeeId
  }

  fun setCameraOn(on: Boolean) {
    cameraOn = on
  }

  fun setSpeakerOn(on: Boolean) {
    speakerOn = on
  }

  fun registerVideoView(view: ExpoPanditChimeVideoView) {
    videoViews.removeAll { it.get() == null }
    if (videoViews.none { it.get() === view }) {
      videoViews.add(WeakReference(view))
    }
  }

  fun unregisterVideoView(view: ExpoPanditChimeVideoView) {
    videoViews.removeAll { it.get() == null || it.get() === view }
  }

  fun bindVideoView(view: VideoRenderView, tileId: Int) {
    audioVideo?.bindVideoView(view, tileId)
  }

  fun unbindVideoView(tileId: Int) {
    audioVideo?.unbindVideoView(tileId)
  }

  fun notifySessionStarted() {
    videoViews.removeAll { it.get() == null }
    videoViews.forEach { it.get()?.tryBind() }
  }

  fun notifyTilesChanged() {
    videoViews.removeAll { it.get() == null }
    videoViews.forEach { it.get()?.tryBind() }
  }

  fun clear() {
    videoViews.removeAll { it.get() == null }
    videoViews.forEach { it.get()?.unbind() }
    videoViews.clear()
    meetingSession = null
    audioVideo = null
    localAttendeeId = null
    cameraOn = true
  }
}
