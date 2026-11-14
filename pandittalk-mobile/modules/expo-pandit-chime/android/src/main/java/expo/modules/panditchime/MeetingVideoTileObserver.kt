package expo.modules.panditchime

import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.VideoTileObserver
import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.VideoTileState

class MeetingVideoTileObserver(
  private val onTileAdded: (VideoTileState) -> Unit,
  private val onTileRemoved: (VideoTileState) -> Unit,
) : VideoTileObserver {
  override fun onVideoTileAdded(tileState: VideoTileState) {
    if (tileState.isContent) return
    onTileAdded(tileState)
    ChimeSessionHolder.notifyTilesChanged()
  }

  override fun onVideoTileRemoved(tileState: VideoTileState) {
    if (tileState.isContent) return
    ChimeSessionHolder.unbindVideoView(tileState.tileId)
    onTileRemoved(tileState)
    ChimeSessionHolder.notifyTilesChanged()
  }

  override fun onVideoTilePaused(tileState: VideoTileState) {}

  override fun onVideoTileResumed(tileState: VideoTileState) {}

  override fun onVideoTileSizeChanged(tileState: VideoTileState) {}
}
