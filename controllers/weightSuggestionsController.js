import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { normalizeExerciseKey } from '@/utils/workoutUtils';

const WEIGHT_INCREMENT = 5;

function suggestionsDoc(uid, exerciseKey) {
	return doc(db, 'users', uid, 'weightSuggestions', exerciseKey);
}

/**
 * Evaluate a completed session and write weight increase suggestions
 * for any exercise where the user hit or exceeded target reps on all sets.
 * @param {string} uid - User ID
 * @param {object} session - Completed session object
 */
export async function evaluateSessionForSuggestions(uid, session) {
	if (!session?.exercises?.length) return;

	const writes = [];

	for (const exercise of session.exercises) {
		const savedSets = exercise.sets?.filter((s) => s.saved) ?? [];
		if (savedSets.length === 0) continue;

		const targetReps = exercise.targetReps;
		if (!targetReps) continue;

		const targetStr = String(targetReps).toLowerCase();
		if (targetStr === 'amrap' || targetStr === 'time') continue;

		const target = Number(targetReps);
		if (!Number.isFinite(target)) continue;

		// All sets must meet or exceed target reps
		const allSetsMet = savedSets.every((s) => {
			const reps = Number(s.reps);
			return Number.isFinite(reps) && reps >= target;
		});

		if (!allSetsMet) continue;

		const lastSet = savedSets[savedSets.length - 1];
		const previousWeight = Number(lastSet.weight);
		if (!Number.isFinite(previousWeight) || previousWeight <= 0) continue;

		const exerciseKey = normalizeExerciseKey(exercise.name);
		const suggestedWeight = previousWeight + WEIGHT_INCREMENT;
		const reason = `Hit all ${savedSets.length}×${target} at ${previousWeight} lbs`;

		writes.push(
			setDoc(
				suggestionsDoc(uid, exerciseKey),
				{
					exerciseName: exercise.name,
					exerciseKey,
					suggestedWeight,
					previousWeight,
					reason,
					sessionId: session.id,
					createdAt: new Date().toISOString(),
					acknowledged: false
				}
			)
		);
	}

	await Promise.all(writes);
}

/**
 * Get the pending (unacknowledged) weight suggestion for an exercise.
 * @param {string} uid - User ID
 * @param {string} exerciseName - Exercise name
 * @returns {Promise<object|null>}
 */
export async function getWeightSuggestion(uid, exerciseName) {
	try {
		const exerciseKey = normalizeExerciseKey(exerciseName);
		const snap = await getDoc(suggestionsDoc(uid, exerciseKey));

		if (!snap.exists()) return null;

		const data = snap.data();
		return data.acknowledged ? null : data;
	} catch (error) {
		console.warn('Failed to get weight suggestion:', error);
		return null;
	}
}

/**
 * Mark a weight suggestion as acknowledged (dismissed by the user).
 * @param {string} uid - User ID
 * @param {string} exerciseName - Exercise name
 */
export async function acknowledgeWeightSuggestion(uid, exerciseName) {
	try {
		const exerciseKey = normalizeExerciseKey(exerciseName);
		await setDoc(
			suggestionsDoc(uid, exerciseKey),
			{ acknowledged: true },
			{ merge: true }
		);
	} catch (error) {
		console.warn('Failed to acknowledge weight suggestion:', error);
	}
}
