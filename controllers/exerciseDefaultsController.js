import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	where
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

/**
 * Get the weight from the last completed session for a specific exercise
 * @param {string} uid - User ID
 * @param {string} exerciseName - Exercise name
 * @param {string} templateId - Current workout template ID to match
 * @returns {Promise<{weight: number, shouldIncrease: boolean} | null>}
 */
export async function getLastCompletedWeight(uid, exerciseName, templateId) {
	try {
		const exerciseKey = normalizeExerciseKey(exerciseName);

		// Query for completed sessions with this template
		const sessionsRef = collection(db, 'users', uid, 'sessions');
		const q = query(
			sessionsRef,
			where('templateId', '==', templateId),
			where('status', '==', 'completed'),
			orderBy('completedAt', 'desc'),
			limit(5) // Get last 5 sessions to find the exercise
		);

		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			return null;
		}

		// Find the most recent session that has this exercise
		for (const docSnap of snapshot.docs) {
			const session = docSnap.data();
			const exercise = session.exercises?.find(
				(ex) => normalizeExerciseKey(ex.name) === exerciseKey
			);

			if (!exercise || !exercise.sets || exercise.sets.length === 0) {
				continue;
			}

			// Get the saved sets only
			const savedSets = exercise.sets.filter((s) => s.saved === true);
			if (savedSets.length === 0) {
				continue;
			}

			// Find the last set
			const lastSet = savedSets[savedSets.length - 1];

			if (!lastSet || !lastSet.weight) {
				continue;
			}

			const weight = Number(lastSet.weight);
			if (!Number.isFinite(weight)) {
				continue;
			}

			// Check if they hit target reps on the last set (for progressive overload)
			let shouldIncrease = false;
			const targetReps = exercise.targetReps;
			const lastSetReps = Number(lastSet.reps);

			// Only check for numeric target reps (not AMRAP or time)
			if (
				targetReps &&
				String(targetReps).toLowerCase() !== 'amrap' &&
				String(targetReps).toLowerCase() !== 'time'
			) {
				const target = Number(targetReps);
				if (Number.isFinite(target) && Number.isFinite(lastSetReps)) {
					// If they hit or exceeded target reps, suggest increase
					shouldIncrease = lastSetReps >= target;
				}
			}

			return {
				weight,
				shouldIncrease,
				lastSetReps,
				targetReps,
				sessionDate: session.completedAt || session.date
			};
		}

		return null;
	} catch (error) {
		console.warn('Failed to get last completed weight:', error);
		return null;
	}
}

/**
 * Get smart default weight for an exercise
 * Checks workout history first, then falls back to saved defaults
 * @param {string} uid - User ID
 * @param {string} exerciseName - Exercise name
 * @param {string} templateId - Current workout template ID
 * @returns {Promise<number | null>}
 */
export async function getSmartDefaultWeight(uid, exerciseName, templateId) {
	try {
		// First, check workout history
		const historyData = await getLastCompletedWeight(
			uid,
			exerciseName,
			templateId
		);

		if (historyData) {
			const { weight, shouldIncrease } = historyData;
			// If they hit target reps last time, add 5 lbs
			return shouldIncrease ? weight + 5 : weight;
		}

		// Fallback to saved defaults if no history
		const defaults = await loadExerciseDefaults(uid);
		const exerciseKey = normalizeExerciseKey(exerciseName);
		const defaultData = defaults[exerciseKey];

		if (defaultData && defaultData.defaultWeight != null) {
			return Number(defaultData.defaultWeight);
		}

		return null;
	} catch (error) {
		console.warn('Failed to get smart default weight:', error);
		return null;
	}
}
