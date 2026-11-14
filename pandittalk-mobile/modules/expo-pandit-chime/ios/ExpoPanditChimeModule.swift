import AVFoundation
import AmazonChimeSDK
import ExpoModulesCore
import UIKit

public final class ExpoPanditChimeModule: Module, AudioVideoObserver, VideoTileObserver, RealtimeObserver {
  private var meetingSession: MeetingSession?
  private var localAttendeeId: String?
  private var hasVideo = false
  private var userMuted = false
  private var cameraOn = true
  private var sessionMediaActive = false
  private var restoredIdleTimerDisabled: Bool?

  public func definition() -> ModuleDefinition {
    Name("ExpoPanditChime")
    Events("onMeetingStart", "onMeetingEnd", "onError", "onRemoteVolumeChanged", "onLocalSignalChanged", "onVideoTileAdded", "onVideoTileRemoved")

    View(ExpoPanditChimeVideoView.self) {
      Prop("tileId") { (view: ExpoPanditChimeVideoView, value: Int) in view.setTileId(value) }
      Prop("mirror") { (view: ExpoPanditChimeVideoView, value: Bool) in view.setMirror(value) }
    }

    AsyncFunction("startMeeting") { (meeting: [String: Any], attendee: [String: Any]) in
      try self.start(meeting: meeting, attendee: attendee, video: false)
    }
    AsyncFunction("startVideoMeeting") { (meeting: [String: Any], attendee: [String: Any]) in
      try self.start(meeting: meeting, attendee: attendee, video: true)
    }
    Function("stopMeeting") { self.stop() }
    Function("setMuted") { (muted: Bool) -> Bool in self.setMuted(muted) }
    Function("setSpeakerOn") { (enabled: Bool) in self.setSpeakerOn(enabled) }
    Function("setCameraOn") { (enabled: Bool) in self.setCameraOn(enabled) }
    Function("flipCamera") { self.meetingSession?.audioVideo.switchCamera() }
    Function("enterWaitingRoomMode") { self.enterWaitingRoomMode() }
    Function("enableSessionMedia") { self.enableSessionMedia() }
    Function("resumeForegroundMedia") { self.resumeForegroundMedia() }
    Function("setRemoteAudioEnabled") { (_: Bool) in }

    AsyncFunction("requestMicrophonePermission") { () -> String in
      try await self.requestMicrophonePermission()
    }
    AsyncFunction("requestCameraPermission") { () -> String in
      try await self.requestCameraPermission()
    }
  }

  private func requestMicrophonePermission() async throws -> String {
    let session = AVAudioSession.sharedInstance()
    switch session.recordPermission {
    case .granted:
      return "granted"
    case .denied:
      return "denied"
    case .undetermined:
      return await withCheckedContinuation { continuation in
        session.requestRecordPermission { granted in
          continuation.resume(returning: granted ? "granted" : "denied")
        }
      }
    @unknown default:
      return "denied"
    }
  }

  private func requestCameraPermission() async throws -> String {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      return "granted"
    case .denied, .restricted:
      return "denied"
    case .notDetermined:
      return await withCheckedContinuation { continuation in
        AVCaptureDevice.requestAccess(for: .video) { granted in
          continuation.resume(returning: granted ? "granted" : "denied")
        }
      }
    @unknown default:
      return "denied"
    }
  }

  private func start(meeting: [String: Any], attendee: [String: Any], video: Bool) throws {
    stop()
    guard let meetingId = meeting["MeetingId"] as? String, !meetingId.isEmpty,
          let attendeeId = attendee["AttendeeId"] as? String, !attendeeId.isEmpty,
          let joinToken = attendee["JoinToken"] as? String, !joinToken.isEmpty else {
      throw Exception(name: "ERR_CHIME_CONFIGURATION", description: "Chime meeting or attendee credentials are missing.")
    }
    let placement = meeting["MediaPlacement"] as? [String: Any] ?? [:]
    let urls = MeetingSessionURLs(
      audioFallbackUrl: placement["AudioFallbackUrl"] as? String ?? "",
      audioHostUrl: placement["AudioHostUrl"] as? String ?? "",
      turnControlUrl: placement["TurnControlUrl"] as? String ?? "",
      signalingUrl: placement["SignalingUrl"] as? String ?? "",
      urlRewriter: URLRewriterUtils.defaultUrlRewriter
    )
    let credentials = MeetingSessionCredentials(
      attendeeId: attendeeId,
      externalUserId: attendee["ExternalUserId"] as? String ?? "",
      joinToken: joinToken
    )
    let configuration = MeetingSessionConfiguration(
      meetingId: meetingId,
      credentials: credentials,
      urls: urls,
      urlRewriter: URLRewriterUtils.defaultUrlRewriter
    )
    let session = DefaultMeetingSession(configuration: configuration, logger: ConsoleLogger(name: "PanditTalkChime", level: .ERROR))
    meetingSession = session
    localAttendeeId = attendeeId
    hasVideo = video
    userMuted = false
    let audioVideo = session.audioVideo
    audioVideo.addAudioVideoObserver(observer: self)
    audioVideo.addRealtimeObserver(observer: self)
    if video { audioVideo.addVideoTileObserver(observer: self) }
    ChimeSessionStore.shared.setAudioVideo(audioVideo)
    setIdleTimerDisabled(video)
    try audioVideo.start(audioVideoConfiguration: AudioVideoConfiguration(audioMode: .mono16K))
  }

  private func stop() {
    guard let session = meetingSession else {
      setIdleTimerDisabled(false)
      return
    }
    let audioVideo = session.audioVideo
    if hasVideo {
      audioVideo.stopLocalVideo()
      audioVideo.removeVideoTileObserver(observer: self)
    }
    audioVideo.removeRealtimeObserver(observer: self)
    audioVideo.removeAudioVideoObserver(observer: self)
    ChimeSessionStore.shared.clear()
    audioVideo.stop()
    meetingSession = nil
    localAttendeeId = nil
    hasVideo = false
    userMuted = false
    setIdleTimerDisabled(false)
  }

  private func setIdleTimerDisabled(_ disabled: Bool) {
    DispatchQueue.main.async {
      if disabled {
        if self.restoredIdleTimerDisabled == nil {
          self.restoredIdleTimerDisabled = UIApplication.shared.isIdleTimerDisabled
        }
        UIApplication.shared.isIdleTimerDisabled = true
      } else if let previous = self.restoredIdleTimerDisabled {
        UIApplication.shared.isIdleTimerDisabled = previous
        self.restoredIdleTimerDisabled = nil
      }
    }
  }

  private func setMuted(_ muted: Bool) -> Bool {
    guard let audioVideo = meetingSession?.audioVideo else { return false }
    let ok = muted ? audioVideo.realtimeLocalMute() : audioVideo.realtimeLocalUnmute()
    if ok { userMuted = muted }
    return ok
  }

  private func setSpeakerOn(_ enabled: Bool) {
    try? AVAudioSession.sharedInstance().overrideOutputAudioPort(enabled ? .speaker : .none)
  }

  private func setCameraOn(_ enabled: Bool) {
    cameraOn = enabled
    guard hasVideo, let audioVideo = meetingSession?.audioVideo else { return }
    if enabled { try? audioVideo.startLocalVideo() } else { audioVideo.stopLocalVideo() }
  }

  private func enterWaitingRoomMode() {
    sessionMediaActive = false
    setMuted(true)
    if hasVideo { meetingSession?.audioVideo.stopRemoteVideo() }
  }

  private func enableSessionMedia() {
    sessionMediaActive = true
    if !userMuted { meetingSession?.audioVideo.realtimeLocalUnmute() }
    if hasVideo { meetingSession?.audioVideo.startRemoteVideo() }
  }

  private func resumeForegroundMedia() {
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
    try? session.setActive(true)
    ChimeSessionStore.shared.rebindViews()
    guard meetingSession?.audioVideo != nil else { return }
    _ = setMuted(userMuted)
    if sessionMediaActive && hasVideo {
      meetingSession?.audioVideo.startRemoteVideo()
      if cameraOn { try? meetingSession?.audioVideo.startLocalVideo() }
    }
  }

  public func audioSessionDidStartConnecting(reconnecting: Bool) {}
  public func audioSessionDidStart(reconnecting: Bool) {
    if hasVideo { try? meetingSession?.audioVideo.startLocalVideo() }
    setMuted(true)
    sendEvent("onMeetingStart", [:])
  }
  public func audioSessionDidDrop() {}
  public func audioSessionDidStopWithStatus(sessionStatus: MeetingSessionStatus) { sendEvent("onMeetingEnd", [:]) }
  public func audioSessionDidCancelReconnect() {}
  public func connectionDidRecover() {}
  public func connectionDidBecomePoor() {}
  public func videoSessionDidStartConnecting() {}
  public func videoSessionDidStartWithStatus(sessionStatus: MeetingSessionStatus) {}
  public func videoSessionDidStopWithStatus(sessionStatus: MeetingSessionStatus) {}
  public func remoteVideoSourcesDidBecomeAvailable(sources: [RemoteVideoSource]) {}
  public func remoteVideoSourcesDidBecomeUnavailable(sources: [RemoteVideoSource]) {}
  public func cameraSendAvailabilityDidChange(available: Bool) {}

  public func videoTileDidAdd(tileState: VideoTileState) {
    guard !tileState.isContent else { return }
    sendEvent("onVideoTileAdded", ["tileId": tileState.tileId, "attendeeId": tileState.attendeeId, "isLocal": tileState.isLocalTile, "isContent": tileState.isContent])
    ChimeSessionStore.shared.rebindViews()
  }
  public func videoTileDidRemove(tileState: VideoTileState) {
    guard !tileState.isContent else { return }
    ChimeSessionStore.shared.unbind(tileId: tileState.tileId)
    sendEvent("onVideoTileRemoved", ["tileId": tileState.tileId, "attendeeId": tileState.attendeeId, "isLocal": tileState.isLocalTile, "isContent": tileState.isContent])
  }
  public func videoTileDidPause(tileState: VideoTileState) {}
  public func videoTileDidResume(tileState: VideoTileState) {}
  public func videoTileSizeDidChange(tileState: VideoTileState) {}

  public func volumeDidChange(volumeUpdates: [VolumeUpdate]) {
    for update in volumeUpdates where update.attendeeInfo.attendeeId != localAttendeeId {
      let volume: Double
      switch update.volumeLevel {
      case .low: volume = 0.33
      case .medium: volume = 0.66
      case .high: volume = 1.0
      default: volume = 0.0
      }
      sendEvent("onRemoteVolumeChanged", ["attendeeId": update.attendeeInfo.attendeeId, "volume": volume, "muted": update.volumeLevel == .muted])
    }
  }
  public func signalStrengthDidChange(signalUpdates: [SignalUpdate]) {
    for update in signalUpdates where update.attendeeInfo.attendeeId == localAttendeeId {
      let level: String
      switch update.signalStrength {
      case .high: level = "high"
      case .low: level = "low"
      default: level = "none"
      }
      sendEvent("onLocalSignalChanged", ["level": level])
    }
  }
  public func attendeesDidJoin(attendeeInfo: [AttendeeInfo]) {}
  public func attendeesDidLeave(attendeeInfo: [AttendeeInfo]) {}
  public func attendeesDidDrop(attendeeInfo: [AttendeeInfo]) {}
  public func attendeesDidMute(attendeeInfo: [AttendeeInfo]) {}
  public func attendeesDidUnmute(attendeeInfo: [AttendeeInfo]) {}
}
