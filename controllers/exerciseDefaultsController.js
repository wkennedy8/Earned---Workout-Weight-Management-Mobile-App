import {
	collection,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function defaultsCol(uid) {
	return collection(db, 'users', uid, 'exerciseDefaults');
}

export function normalizeExerciseKey(name) {
	return String(name || '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');
}

export async function getExerciseDefault(uid, exerciseName) {
	const key = normalizeExerciseKey(exerciseName);
	const ref = doc(db, 'users', uid, 'exerciseDefaults', key);
	const snap = await getDoc(ref);
	return snap.exists() ? snap.data() : null;
}

export async function getAllExerciseDefaults(uid) {
	const snap = await getDocs(defaultsCol(uid));
	const map = {};
	snap.forEach((d) => {
		map[d.id] = d.data();
	});
	return map;
}

export async function setExerciseDefault(
	uid,
	exerciseName,
	defaultWeight,
	reason = ''
) {
	const key = normalizeExerciseKey(exerciseName);
	const ref = doc(db, 'users', uid, 'exerciseDefaults', key);

	await setDoc(
		ref,
		{
			exerciseKey: key,
			defaultWeight,
			reason,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}

/**
 * Load exercise default weights from Firestore
 * @param {string} uid - User ID
 * @returns {Object} Map of exercise keys to default weight data
 */
export async function loadExerciseDefaults(uid) {
	try {
		const ref = doc(db, 'users', uid, 'preferences', 'exercise_defaults');
		const snap = await getDoc(ref);

		if (!snap.exists()) {
			return {};
		}

		const data = snap.data();
		// Remove the metadata field if it exists, return just the defaults map
		const { updatedAt, ...defaults } = data;
		return defaults && typeof defaults === 'object' ? defaults : {};
	} catch (e) {
		console.warn('Failed to load exercise defaults:', e);
		return {};
	}
}

/**
 * Save exercise default weights to Firestore
 * @param {string} uid - User ID
 * @param {Object} defaultsMap - Map of exercise keys to default weight data
 *
 * Example defaultsMap structure:
 * {
 *   "bench press": {
 *     defaultWeight: 225,
 *     updatedAt: "2025-01-21T10:30:00.000Z",
 *     reason: "Hit 12/12 on last set"
 *   },
 *   "squat": {
 *     defaultWeight: 315,
 *     updatedAt: "2025-01-20T09:15:00.000Z",
 *     reason: "Hit 12/12 on last set"
 *   }
 * }
 */
export async function saveExerciseDefaults(uid, defaultsMap) {
	try {
		const ref = doc(db, 'users', uid, 'preferences', 'exercise_defaults');
		await setDoc(
			ref,
			{
				...defaultsMap,
				updatedAt: serverTimestamp()
			},
			{ merge: true }
		);
	} catch (e) {
		console.warn('Failed to save exercise defaults:', e);
		throw e;
	}
}
