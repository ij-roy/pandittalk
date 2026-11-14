package expo.modules.panditchime

import com.amazonaws.services.chime.sdk.meetings.audiovideo.AttendeeInfo
import com.amazonaws.services.chime.sdk.meetings.audiovideo.SignalStrength
import com.amazonaws.services.chime.sdk.meetings.audiovideo.SignalUpdate
import com.amazonaws.services.chime.sdk.meetings.audiovideo.VolumeLevel
import com.amazonaws.services.chime.sdk.meetings.audiovideo.VolumeUpdate
import com.amazonaws.services.chime.sdk.meetings.realtime.RealtimeObserver

class MeetingRealtimeObserver(
  private val localAttendeeId: String,
  private val onRemoteVolume: (attendeeId: String, volume: Double, muted: Boolean) -> Unit,
  private val onLocalSignal: (level: String) -> Unit,
) : RealtimeObserver {
  override fun onAttendeesJoined(attendeeInfo: Array<AttendeeInfo>) {}

  override fun onAttendeesLeft(attendeeInfo: Array<AttendeeInfo>) {}

  override fun onAttendeesDropped(attendeeInfo: Array<AttendeeInfo>) {}

  override fun onAttendeesMuted(attendeeInfo: Array<AttendeeInfo>) {}

  override fun onAttendeesUnmuted(attendeeInfo: Array<AttendeeInfo>) {}

  override fun onVolumeChanged(volumeUpdates: Array<VolumeUpdate>) {
    for (update in volumeUpdates) {
      val attendeeId = update.attendeeInfo.attendeeId
      if (attendeeId == localAttendeeId) continue

      val volumeLevel = update.volumeLevel
      val volume = when (volumeLevel) {
        VolumeLevel.Muted -> 0.0
        VolumeLevel.NotSpeaking -> 0.0
        VolumeLevel.Low -> 0.33
        VolumeLevel.Medium -> 0.66
        VolumeLevel.High -> 1.0
      }
      onRemoteVolume(attendeeId, volume, volumeLevel == VolumeLevel.Muted)
    }
  }

  override fun onSignalStrengthChanged(signalUpdates: Array<SignalUpdate>) {
    for (update in signalUpdates) {
      if (update.attendeeInfo.attendeeId != localAttendeeId) continue
      val level = when (update.signalStrength) {
        SignalStrength.High -> "high"
        SignalStrength.Low -> "low"
        else -> "none"
      }
      onLocalSignal(level)
    }
  }
}
