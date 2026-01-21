// lib/firestorePersistence.js
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from './firebase';

let enabled = false;

export async function enableFirestorePersistence() {
	if (enabled) return true;

	try {
		// If your app might be open in multiple tabs (web), use multi-tab.
		// In Expo native, this will typically behave like single-instance.
		await enableIndexedDbPersistence(db);
		enabled = true;
		return true;
	} catch (e) {
		// Common cases:
		// - failed-precondition (multiple tabs)
		// - unimplemented (platform doesn't support persistence)
		console.warn('Firestore persistence not enabled:', e?.code || e);
		return false;
	}
}
