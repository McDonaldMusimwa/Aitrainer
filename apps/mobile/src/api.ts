import { Platform } from 'react-native';
import { fetch as streamingFetch } from 'expo/fetch';
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

async function errorFrom(response: { json(): Promise<any> }): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  return new Error(typeof body.detail === 'string' ? body.detail : 'Request failed. Please try again.');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(baseUrl + path, { ...options, signal: controller.signal });
    if (!response.ok) throw await errorFrom(response);
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
type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; exchange: Exchange }
  | { type: 'error'; message: string };

// Gives up only when no data has arrived for this long, so a long reply that
// keeps streaming is never cut off.
const chatIdleTimeoutMs = 60000;

/** Streams the reply, calling onDelta with each piece of text as it arrives,
 * and resolves with the saved exchange once the reply is complete. */
export async function sendMessage(message: string, onDelta: (text: string) => void): Promise<Exchange> {
  const controller = new AbortController();
  let timedOut = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const armTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => { timedOut = true; controller.abort(); }, chatIdleTimeoutMs);
  };
  armTimeout();
  try {
    // React Native's built-in fetch cannot read a response body as a stream.
    const response = await streamingFetch(baseUrl + '/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    if (!response.ok) throw await errorFrom(response);
    if (!response.body) throw new Error('Streaming replies are not supported on this device.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      armTimeout();
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const data = buffer.slice(0, boundary).split('\n')
          .filter(line => line.startsWith('data: ')).map(line => line.slice(6)).join('\n');
        buffer = buffer.slice(boundary + 2);
        if (!data) continue;
        const event = JSON.parse(data) as ChatEvent;
        if (event.type === 'delta') onDelta(event.text);
        else if (event.type === 'error') throw new Error(event.message);
        else return event.exchange;
      }
    }
    throw new Error('The connection closed before the reply finished. Please try again.');
  } catch (error) {
    if (timedOut) throw new Error('The reply stalled. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

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
