package expo.modules.panditchime

import android.content.Context
import com.amazonaws.services.chime.sdk.meetings.audiovideo.video.DefaultVideoRenderView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class ExpoPanditChimeVideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val renderView = DefaultVideoRenderView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(it)
  }

  private var tileId: Int = -1
  private var mirror: Boolean = false
  private var boundTileId: Int? = null

  init {
    keepScreenOn = true
    ChimeSessionHolder.registerVideoView(this)
  }

  fun setTileId(value: Int) {
    if (tileId == value) return
    unbind()
    tileId = value
    tryBind()
  }

  fun setMirror(value: Boolean) {
    mirror = value
    renderView.mirror = value
  }

  fun tryBind() {
    if (tileId < 0) {
      unbind()
      return
    }

    val audioVideo = ChimeSessionHolder.audioVideo ?: return
    if (boundTileId != null && boundTileId != tileId) {
      audioVideo.unbindVideoView(boundTileId!!)
      boundTileId = null
    }

    if (boundTileId == tileId) return

    renderView.mirror = mirror
    audioVideo.bindVideoView(renderView, tileId)
    boundTileId = tileId
  }

  fun unbind() {
    val previousTileId = boundTileId ?: return
    ChimeSessionHolder.unbindVideoView(previousTileId)
    boundTileId = null
  }

  override fun onDetachedFromWindow() {
    unbind()
    ChimeSessionHolder.unregisterVideoView(this)
    super.onDetachedFromWindow()
  }
}
