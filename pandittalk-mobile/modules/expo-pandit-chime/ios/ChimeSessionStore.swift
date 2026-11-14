import AmazonChimeSDK
import Foundation

final class ChimeSessionStore {
  static let shared = ChimeSessionStore()

  private weak var audioVideo: AudioVideoFacade?
  private var videoViews = NSHashTable<ExpoPanditChimeVideoView>.weakObjects()

  func setAudioVideo(_ audioVideo: AudioVideoFacade?) {
    self.audioVideo = audioVideo
    rebindViews()
  }

  func register(_ view: ExpoPanditChimeVideoView) {
    videoViews.add(view)
    view.bindIfPossible(audioVideo: audioVideo)
  }

  func unregister(_ view: ExpoPanditChimeVideoView) {
    view.unbind(audioVideo: audioVideo)
    videoViews.remove(view)
  }

  func rebindViews() {
    for view in videoViews.allObjects {
      view.bindIfPossible(audioVideo: audioVideo)
    }
  }

  func unbind(tileId: Int) {
    audioVideo?.unbindVideoView(tileId: tileId)
  }

  func clear() {
    for view in videoViews.allObjects {
      view.unbind(audioVideo: audioVideo)
    }
    audioVideo = nil
  }
}
