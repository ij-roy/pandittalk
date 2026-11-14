import AmazonChimeSDK
import ExpoModulesCore

final class ExpoPanditChimeVideoView: ExpoView {
  private let renderView = DefaultVideoRenderView(frame: .zero)
  private var tileId = -1
  private var boundTileId: Int?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    renderView.contentMode = .scaleAspectFill
    renderView.frame = bounds
    renderView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(renderView)
    ChimeSessionStore.shared.register(self)
  }

  deinit {
    ChimeSessionStore.shared.unregister(self)
  }

  func setTileId(_ value: Int) {
    guard tileId != value else { return }
    unbind(audioVideo: nil)
    tileId = value
    ChimeSessionStore.shared.rebindViews()
  }

  func setMirror(_ value: Bool) {
    renderView.mirror = value
  }

  func bindIfPossible(audioVideo: AudioVideoFacade?) {
    guard tileId >= 0, let audioVideo else { return }
    if boundTileId == tileId { return }
    if let boundTileId { audioVideo.unbindVideoView(tileId: boundTileId) }
    audioVideo.bindVideoView(videoView: renderView, tileId: tileId)
    boundTileId = tileId
  }

  func unbind(audioVideo: AudioVideoFacade?) {
    guard let boundTileId else { return }
    audioVideo?.unbindVideoView(tileId: boundTileId)
    self.boundTileId = nil
  }
}
