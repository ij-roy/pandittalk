package expo.modules.panditchime

import com.amazonaws.services.chime.sdk.meetings.audiovideo.AudioVideoObserver
import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.RemoteVideoSource
import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.VideoTileState
import com.amazonaws.services.chime.sdk.meetings.session.MeetingSessionStatus

class MeetingAudioObserver(
  private val onStarted: (reconnecting: Boolean) -> Unit,
  private val onStopped: () -> Unit,
) : AudioVideoObserver {
  override fun onAudioSessionStartedConnecting(reconnecting: Boolean) {}

  override fun onAudioSessionStarted(reconnecting: Boolean) {
    onStarted(reconnecting)
  }

  override fun onAudioSessionDropped() {}

  override fun onAudioSessionStopped(sessionStatus: MeetingSessionStatus) {
    onStopped()
  }

  override fun onAudioSessionCancelledReconnect() {}

  override fun onConnectionBecamePoor() {}

  override fun onConnectionRecovered() {}

  override fun onVideoSessionStartedConnecting() {}

  override fun onVideoSessionStarted(sessionStatus: MeetingSessionStatus) {}

  override fun onVideoSessionStopped(sessionStatus: MeetingSessionStatus) {}

  override fun onCameraSendAvailabilityUpdated(available: Boolean) {}

  override fun onRemoteVideoSourceAvailable(sources: List<RemoteVideoSource>) {}

  override fun onRemoteVideoSourceUnavailable(sources: List<RemoteVideoSource>) {}
}
