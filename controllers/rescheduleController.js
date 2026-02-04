import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Save a custom schedule override for a user
 */
export async function saveScheduleOverride(uid, dateKey, workoutId) {
	try {
		const overrideRef = doc(db, 'users', uid, 'scheduleOverrides', dateKey);

		await setDoc(overrideRef, {
			date: dateKey,
			workoutId: workoutId,
			createdAt: new Date().toISOString()
		});

		return true;
	} catch (error) {
		console.error('Error saving schedule override:', error);
		throw error;
	}
}

/**
 * Get schedule override for a specific date
 */
export async function getScheduleOverride(uid, dateKey) {
	try {
		const overrideRef = doc(db, 'users', uid, 'scheduleOverrides', dateKey);
		const snap = await getDoc(overrideRef);

		if (!snap.exists()) return null;

		return snap.data();
	} catch (error) {
		console.error('Error getting schedule override:', error);
		return null;
	}
}

/**
 * Delete schedule override for a specific date
 */
export async function deleteScheduleOverride(uid, dateKey) {
	try {
		const overrideRef = doc(db, 'users', uid, 'scheduleOverrides', dateKey);
		await deleteDoc(overrideRef);
		return true;
	} catch (error) {
		console.error('Error deleting schedule override:', error);
		throw error;
	}
}

/**
 * Mark today as rest day and reschedule workout with cascade
 * @param {string} uid - User ID
 * @param {object} plan - User's workout plan
 * @param {string} todayKey - Today's date key (YYYY-MM-DD)
 * @param {object} currentWorkout - The actual workout object that's currently scheduled for today
 */
export async function markAsRestDayAndReschedule(
	uid,
	plan,
	todayKey,
	currentWorkout
) {
	// Import here to avoid circular dependency
	const { getWorkoutForDateFromPlan, PLAN } = require('@/utils/workoutPlan');

	try {
		// If today is already a rest day, nothing to do
		if (!currentWorkout || currentWorkout.id === 'rest') {
			throw new Error('Today is already a rest day');
		}

		// Mark today as rest
		await saveScheduleOverride(uid, todayKey, 'rest');

		// Parse today's date
		const [year, month, day] = todayKey.split('-').map(Number);
		const currentDate = new Date(year, month - 1, day);

		// Now cascade the workouts forward
		let workoutToMove = currentWorkout;

		// Look ahead up to 7 days to place all workouts
		for (let i = 1; i <= 7; i++) {
			const nextDate = new Date(currentDate);
			nextDate.setDate(nextDate.getDate() + i);

			const nextYear = nextDate.getFullYear();
			const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
			const nextDay = String(nextDate.getDate()).padStart(2, '0');
			const nextKey = `${nextYear}-${nextMonth}-${nextDay}`;

			// Check if there's already an override for this day
			const existingOverride = await getScheduleOverride(uid, nextKey);

			// Get what was originally scheduled for this day
			const originalWorkout = getWorkoutForDateFromPlan(nextDate, plan);

			// Determine what workout is currently scheduled for this day
			let currentlyScheduled;
			if (existingOverride) {
				// Use override if it exists
				if (existingOverride.workoutId === 'rest') {
					currentlyScheduled = {
						id: 'rest',
						title: 'Rest Day',
						tag: 'Rest',
						exercises: []
					};
				} else {
					// Find the workout by ID
					currentlyScheduled = null;
					for (const planObj of Object.values(PLAN)) {
						if (
							planObj.workouts &&
							planObj.workouts[existingOverride.workoutId]
						) {
							currentlyScheduled = planObj.workouts[existingOverride.workoutId];
							break;
						}
					}
					if (!currentlyScheduled) {
						currentlyScheduled = originalWorkout;
					}
				}
			} else {
				// Use original schedule
				currentlyScheduled = originalWorkout;
			}

			// Place the workout we're moving
			await saveScheduleOverride(uid, nextKey, workoutToMove.id);

			// If what was here was a rest day, we're done cascading
			if (currentlyScheduled.id === 'rest') {
				break;
			}

			// Otherwise, this workout needs to be moved forward
			workoutToMove = currentlyScheduled;
		}

		// Calculate tomorrow's date for the return message
		const tomorrow = new Date(currentDate);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowYear = tomorrow.getFullYear();
		const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
		const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
		const tomorrowKey = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;

		return {
			success: true,
			movedWorkout: currentWorkout.title,
			movedToDate: tomorrowKey
		};
	} catch (error) {
		console.error('Error rescheduling workouts:', error);
		throw error;
	}
}
