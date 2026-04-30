import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PROGRAM_WEEKS = 8;

function calcEndDate(startDate) {
	const end = new Date(startDate);
	end.setDate(end.getDate() + PROGRAM_WEEKS * 7);
	return end.toISOString();
}

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
			const startDate = new Date().toISOString();
			await setDoc(docRef, {
				currentWeek: 1,
				cycleNumber: 1,
				startDate,
				endDate: calcEndDate(startDate),
				lastUpdated: startDate
			});
			return 1;
		}

		const data = snapshot.data();

		// Backfill endDate and cycleNumber for existing users
		if (!data.endDate || data.cycleNumber == null) {
			await setDoc(
				docRef,
				{
					endDate: calcEndDate(data.startDate),
					cycleNumber: 1
				},
				{ merge: true }
			);
		}

		return data.currentWeek || 1;
	} catch (error) {
		console.error('Error getting program week:', error);
		return 1;
	}
}

/**
 * Get the full lifecycle state of a program
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @returns {Promise<{ currentWeek: number, cycleNumber: number, startDate: string, endDate: string, completedAt: string|null }>}
 */
export async function getProgramProgress(uid, planId) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		const snapshot = await getDoc(docRef);

		if (!snapshot.exists()) {
			const startDate = new Date().toISOString();
			const initial = {
				currentWeek: 1,
				cycleNumber: 1,
				startDate,
				endDate: calcEndDate(startDate),
				completedAt: null,
				lastUpdated: startDate
			};
			await setDoc(docRef, initial);
			return initial;
		}

		const data = snapshot.data();

		// Backfill missing fields for existing users
		const updates = {};
		if (!data.endDate) updates.endDate = calcEndDate(data.startDate);
		if (data.cycleNumber == null) updates.cycleNumber = 1;
		if (Object.keys(updates).length > 0) {
			await setDoc(docRef, updates, { merge: true });
		}

		return {
			currentWeek: data.currentWeek || 1,
			cycleNumber: data.cycleNumber ?? 1,
			startDate: data.startDate,
			endDate: data.endDate ?? updates.endDate,
			completedAt: data.completedAt ?? null
		};
	} catch (error) {
		console.error('Error getting program progress:', error);
		return { currentWeek: 1, cycleNumber: 1, startDate: null, endDate: null, completedAt: null };
	}
}

/**
 * Advance to the next week in the program
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {number} maxWeeks - Maximum weeks in the program (default: 8)
 */
export async function advanceProgramWeek(uid, planId, maxWeeks = PROGRAM_WEEKS) {
	try {
		const currentWeek = await getProgramWeek(uid, planId);

		// Stop at maxWeeks — completion/cycling is handled by weekCompletionController
		if (currentWeek >= maxWeeks) return currentWeek;

		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		await setDoc(
			docRef,
			{
				currentWeek: currentWeek + 1,
				lastUpdated: new Date().toISOString(),
				previousWeek: currentWeek
			},
			{ merge: true }
		);

		return currentWeek + 1;
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
 * Reset the current program back to week 1 without incrementing cycleNumber.
 * Used for mid-cycle restarts where the user didn't complete the program.
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 */
export async function resetProgram(uid, planId) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		const startDate = new Date().toISOString();

		await setDoc(
			docRef,
			{
				currentWeek: 1,
				startDate,
				endDate: calcEndDate(startDate),
				completedAt: null,
				lastUpdated: startDate
			},
			{ merge: true }
		);
	} catch (error) {
		console.error('Error resetting program:', error);
		throw error;
	}
}

/**
 * Start a new program cycle — resets week to 1 and increments cycleNumber
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 */
export async function startNewCycle(uid, planId) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		const snapshot = await getDoc(docRef);
		const cycleNumber = (snapshot.exists() ? snapshot.data().cycleNumber ?? 1 : 1) + 1;
		const startDate = new Date().toISOString();

		await setDoc(
			docRef,
			{
				currentWeek: 1,
				cycleNumber,
				startDate,
				endDate: calcEndDate(startDate),
				completedAt: null,
				lastUpdated: startDate
			},
			{ merge: true }
		);

		return cycleNumber;
	} catch (error) {
		console.error('Error starting new cycle:', error);
		throw error;
	}
}

/**
 * Mark the current program cycle as completed
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 */
export async function completeProgramCycle(uid, planId) {
	try {
		const docRef = doc(db, 'users', uid, 'programProgress', planId);
		await setDoc(
			docRef,
			{ completedAt: new Date().toISOString() },
			{ merge: true }
		);
	} catch (error) {
		console.error('Error completing program cycle:', error);
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
