/**
 * Current signed-in user, in memory only. There's no token/session backend
 * yet (login accepts any credentials — see AccountScreens.tsx), so this is
 * just enough to thread the id created at sign-up through to the rest of
 * the app for this run of the app.
 */
let currentUserId: string | null = null;

export const getCurrentUserId = () => currentUserId;
export const setCurrentUserId = (id: string | null) => { currentUserId = id; };
