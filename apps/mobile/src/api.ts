import { Platform } from 'react-native';
import type {
  Assessment, AssessmentCreateInput, AssessmentDetail,
  ProgressPhoto, ProgressPhotoCreateInput, User, UserCreateInput, UserProfile, UserProfileUpsertInput,
} from './types/domain';

const baseUrl = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000')
).replace(/\/$/, '');

export type Exchange = {
  id: string;
  prompt: string;
  reply: string;
  provider: string;
  created_at: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(baseUrl + path, { ...options, signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed. Please try again.');
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const getHistory = () => request<Exchange[]>('/api/v1/chat');
export const sendMessage = (message: string) => request<Exchange>('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
});

const withJsonBody = (method: 'POST' | 'PUT', body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const registerUser = (input: UserCreateInput) =>
  request<User>('/api/v1/users', withJsonBody('POST', input));

export const getUser = (userId: string) => request<User>(`/api/v1/users/${userId}`);

export const getProfile = (userId: string) => request<UserProfile>(`/api/v1/users/${userId}/profile`);

export const upsertProfile = (userId: string, input: UserProfileUpsertInput) =>
  request<UserProfile>(`/api/v1/users/${userId}/profile`, withJsonBody('PUT', input));

export const createAssessment = (userId: string, input: AssessmentCreateInput) =>
  request<AssessmentDetail>(`/api/v1/users/${userId}/assessments`, withJsonBody('POST', input));

export const getLatestAssessment = (userId: string) =>
  request<AssessmentDetail>(`/api/v1/users/${userId}/assessments/latest`);

export const listAssessments = (userId: string) =>
  request<Assessment[]>(`/api/v1/users/${userId}/assessments`);

export const createProgressPhoto = (userId: string, input: ProgressPhotoCreateInput) =>
  request<ProgressPhoto>(`/api/v1/users/${userId}/progress-photos`, withJsonBody('POST', input));

export const listProgressPhotos = (userId: string) =>
  request<ProgressPhoto[]>(`/api/v1/users/${userId}/progress-photos`);
