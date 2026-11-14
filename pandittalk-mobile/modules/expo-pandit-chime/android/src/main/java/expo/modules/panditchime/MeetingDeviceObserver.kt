package expo.modules.panditchime

import com.amazonaws.services.chime.sdk.meetings.device.DeviceChangeObserver
import com.amazonaws.services.chime.sdk.meetings.device.MediaDevice

class MeetingDeviceObserver(
  private val onDevicesChanged: (List<MediaDevice>) -> Unit,
) : DeviceChangeObserver {
  override fun onAudioDeviceChanged(freshAudioDeviceList: List<MediaDevice>) {
    onDevicesChanged(freshAudioDeviceList)
  }
}
