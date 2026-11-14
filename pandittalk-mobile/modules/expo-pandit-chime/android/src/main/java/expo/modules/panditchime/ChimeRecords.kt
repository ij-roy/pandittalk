package expo.modules.panditchime

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ChimeMediaPlacementRecord : Record {
  @Field
  val AudioFallbackUrl: String? = null

  @Field
  val AudioHostUrl: String? = null

  @Field
  val TurnControlUrl: String? = null

  @Field
  val SignalingUrl: String? = null
}

class ChimeMeetingRecord : Record {
  @Field
  val MeetingId: String? = null

  @Field
  val ExternalMeetingId: String? = null

  @Field
  val MediaRegion: String? = null

  @Field
  val MediaPlacement: ChimeMediaPlacementRecord? = null
}

class ChimeAttendeeRecord : Record {
  @Field
  val AttendeeId: String? = null

  @Field
  val ExternalUserId: String? = null

  @Field
  val JoinToken: String? = null
}
