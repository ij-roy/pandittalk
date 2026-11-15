export type SenderRole = "user" | "pandit";

export type UserRole = "CUSTOMER" | "PANDIT" | "ADMIN";

export interface AuthUserPayload {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: UserRole;
  walletBalance: string;
  coinBalance: number;
  createdAt: string;
  profileCompleted: boolean;
}

export interface CurrentUser {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: UserRole;
  panditId: string | null;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeSeconds?: number;
  hasProfile: boolean;
  isNewUser: boolean;
  user: AuthUserPayload[];
}

export interface PanditMe {
  id: string;
  name: string;
  specialty: string;
  isOnline: boolean;
}

export interface BookingListItem {
  id: string;
  panditId: string;
  panditName: string;
  startTime: string;
  status: string;
  format: string;
  area: string;
  depth: string;
  durationMinutes: number;
  coinsDeducted: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
}

export interface BookingUserDetails {
  userId: string;
  userName: string | null;
  /** Always null for pandits — seeker phones are never disclosed. */
  phoneNumber: string | null;
  dob: string | null;
  placeOfBirth: string | null;
  zodiacSign: string | null;
  maritalStatus: string | null;
  gender: string | null;
  profileCompleted: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  text: string;
  timestamp: number;
}

export interface SessionJoinedPayload {
  bookingId: string;
  messages: Array<{
    sessionId: string;
    senderId: string;
    senderRole: SenderRole;
    message: string;
    timestamp: number;
  }>;
  durationMinutes: number;
  endTime: string;
}

export interface TypingIndicatorPayload {
  bookingId: string;
  userId: string;
}

export interface TimeRemainingPayload {
  bookingId: string;
  remainingSeconds: number;
}

export interface SessionStartedPayload {
  startedAt: string | number;
  endTime: number;
  durationMinutes: number;
}

export interface SocketErrorPayload {
  message: string;
}

export type NotificationType =
  | "booking_confirmed"
  | "session_reminder_30"
  | "session_reminder_10"
  | "session_reminder_5"
  | "session_started"
  | "session_ended"
  | "new_message"
  | "chat_now_accepted"
  | "chat_now_missed"
  | "new_booking";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NewBookingCreatedPayload {
  bookingId: string;
  panditId: string;
  area: string;
}
