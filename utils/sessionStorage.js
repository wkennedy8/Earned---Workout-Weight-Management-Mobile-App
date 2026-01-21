// utils/sessionStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_SESSIONS_KEY = 'workout_sessions_v1';

export async function loadAllSessions() {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_SESSIONS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Failed to load sessions:', e);
		return [];
	}
}

export async function getSessionById(sessionId) {
	if (!sessionId) return null;
	const sessions = await loadAllSessions();
	return sessions.find((s) => s?.id === sessionId) || null;
}

export async function saveAllSessions(sessions) {
	try {
		await AsyncStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
	} catch (e) {
		console.warn('Failed to save sessions:', e);
	}
}

export async function upsertSession(nextSession) {
	const sessions = await loadAllSessions();
	const idx = sessions.findIndex((s) => s.id === nextSession.id);

	const nextAll =
		idx >= 0
			? sessions.map((s, i) => (i === idx ? nextSession : s))
			: [nextSession, ...sessions];

	nextAll.sort((a, b) => String(b.date).localeCompare(String(a.date)));
	await saveAllSessions(nextAll);

	return nextAll;
}
