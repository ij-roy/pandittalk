import axios from 'axios';

import { API_BASE } from '@/lib/authApi';
import { reportMessageBody } from '@/lib/messageActions';

export type SupportRequestPayload = {
  category: string;
  message: string;
  email?: string;
};

export async function createSupportRequest(
  accessToken: string,
  payload: SupportRequestPayload,
): Promise<{ id: string; status: string }> {
  const res = await axios.post(`${API_BASE}/support/requests`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function reportPandit(
  accessToken: string,
  panditId: string,
  panditName: string,
  reason: string,
  bookingId?: string,
): Promise<void> {
  const bookingBit = bookingId ? ` bookingId=${bookingId}` : '';
  await createSupportRequest(accessToken, {
    category: 'report_user',
    message: `Report pandit id=${panditId} name=${panditName}.${bookingBit} Reason: ${reason.trim()}`,
  });
}

export async function reportChatMessage(
  accessToken: string,
  input: {
    panditId: string;
    panditName: string;
    bookingId: string;
    messageId: string;
    text: string;
    reason: string;
  },
): Promise<void> {
  await createSupportRequest(accessToken, {
    category: 'report_user',
    message: reportMessageBody(input),
  });
}

/** Request a personal data export (ops fulfills via support queue). */
export async function requestDataExport(
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return createSupportRequest(accessToken, {
    category: 'data_export',
    message:
      'User requested export of personal data (profile, bookings, wallet history, chat metadata as available). Deliver via support email when ready.',
  });
}
