import axios from 'axios';

import { API_BASE } from '@/lib/authApi';

export type FamilyRelation = 'spouse' | 'child' | 'parent' | 'other';

export type FamilyMember = {
  id: string;
  relation: FamilyRelation;
  name: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates: string | null;
};

export type FamilyMemberDraft = {
  relation: FamilyRelation;
  name: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function listFamilyMembers(accessToken: string): Promise<FamilyMember[]> {
  const { data } = await axios.get<FamilyMember[]>(`${API_BASE}/users/family-members`, {
    headers: authHeaders(accessToken),
  });
  return Array.isArray(data) ? data : [];
}

export async function createFamilyMember(
  accessToken: string,
  draft: FamilyMemberDraft,
): Promise<FamilyMember> {
  const { data } = await axios.post<FamilyMember>(`${API_BASE}/users/family-members`, draft, {
    headers: authHeaders(accessToken),
  });
  return data;
}

export async function deleteFamilyMember(accessToken: string, id: string): Promise<void> {
  await axios.delete(`${API_BASE}/users/family-members/${encodeURIComponent(id)}`, {
    headers: authHeaders(accessToken),
  });
}
