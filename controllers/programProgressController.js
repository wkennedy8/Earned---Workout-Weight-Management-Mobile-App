import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Get the current program week for a user's workout plan
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID (e.g., 'ppl', 'bro_split')
 * @returns {Promise<number>} Current week number (1-8)
 */
export async function getProgramWeek(uid, planId) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		const snapshot = await getDoc(docRef);

		if (!snapshot.exists()) {
			// First time - initialize at week 1
			await setDoc(docRef, {
				currentWeek: 1,
				startDate: new Date().toISOString(),
				lastUpdated: new Date().toISOString()
			});
			return 1;
		}

		const data = snapshot.data();
		return data.currentWeek || 1;
	} catch (error) {
		console.error('Error getting program week:', error);
		return 1; // Default to week 1 on error
	}
}

/**
 * Advance to the next week in the program
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {number} maxWeeks - Maximum weeks in the program (default: 8)
 */
export async function advanceProgramWeek(uid, planId, maxWeeks = 8) {
	try {
		const currentWeek = await getProgramWeek(uid, planId);
		const nextWeek = currentWeek >= maxWeeks ? 1 : currentWeek + 1; // Cycle back to week 1 after max weeks

		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		await setDoc(
			docRef,
			{
				currentWeek: nextWeek,
				lastUpdated: new Date().toISOString(),
				previousWeek: currentWeek
			},
			{ merge: true }
		);

		return nextWeek;
	} catch (error) {
		console.error('Error advancing program week:', error);
		throw error;
	}
}

/**
 * Manually set the program week
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {number} weekNumber - Week to set (1-8)
 */
export async function setProgramWeek(uid, planId, weekNumber) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		await setDoc(
			docRef,
			{
				currentWeek: weekNumber,
				lastUpdated: new Date().toISOString()
			},
			{ merge: true }
		);
	} catch (error) {
		console.error('Error setting program week:', error);
		throw error;
	}
}

/**
 * Resolve the sets and reps for an exercise based on the current program week
 * @param {Object} exercise - Exercise object with weeklyProgression field
 * @param {number} currentWeek - Current week number
 * @returns {Object} { sets: number, reps: string }
 */
export function resolveExerciseProgression(exercise, currentWeek) {
	// If no weekly progression defined, use default sets/reps
	if (
		!exercise.weeklyProgression ||
		!Array.isArray(exercise.weeklyProgression)
	) {
		return {
			sets: exercise.sets,
			reps: exercise.reps
		};
	}

	// Find the progression entry that matches the current week
	const progression = exercise.weeklyProgression.find((prog) =>
		prog.weeks.includes(currentWeek)
	);

	if (!progression) {
		// Fallback to first progression if current week not found
		const firstProg = exercise.weeklyProgression[0];
		return {
			sets: firstProg?.sets || exercise.sets,
			reps: firstProg?.reps || exercise.reps
		};
	}

	return {
		sets: progression.sets,
		reps: progression.reps
	};
}

/**
 * Apply weekly progression to all exercises in a workout template
 * @param {Object} template - Workout template with exercises
 * @param {number} currentWeek - Current week number
 * @returns {Object} Template with resolved sets/reps for the current week
 */
export function applyWeeklyProgression(template, currentWeek) {
	if (!template || !template.exercises) return template;

	return {
		...template,
		exercises: template.exercises.map((exercise) => {
			const resolved = resolveExerciseProgression(exercise, currentWeek);
			return {
				...exercise,
				targetSets: String(resolved.sets),
				targetReps: String(resolved.reps)
			};
		})
	};
}
