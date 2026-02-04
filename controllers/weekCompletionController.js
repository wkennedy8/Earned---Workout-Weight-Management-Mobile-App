import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
	advanceProgramWeek,
	getProgramWeek
} from './programProgressController';

/**
 * Get the schedule for a given workout plan
 * Returns the days each workout is scheduled
 */
function getPlanSchedule(planId) {
	// PPL: 6 workouts per week
	// Monday/Thursday: Push
	// Tuesday/Friday: Pull
	// Wednesday/Saturday: Legs/Abs
	// Sunday: Rest

	const schedules = {
		ppl: {
			totalWorkoutsPerWeek: 6,
			workoutsByDay: {
				0: null, // Sunday - Rest
				1: 'push', // Monday
				2: 'pull', // Tuesday
				3: 'legs_abs', // Wednesday
				4: 'push', // Thursday
				5: 'pull', // Friday
				6: 'legs_abs' // Saturday - Last workout of the week
			},
			lastWorkoutDay: 6 // Saturday
		},
		bro_split: {
			totalWorkoutsPerWeek: 5,
			workoutsByDay: {
				0: null, // Sunday - Rest
				1: 'chest', // Monday
				2: 'back', // Tuesday
				3: 'shoulders', // Wednesday
				4: 'legs', // Thursday
				5: 'arms_abs', // Friday
				6: null // Saturday - Rest
			},
			lastWorkoutDay: 5 // Friday
		},
		fullbody_3day: {
			totalWorkoutsPerWeek: 3,
			workoutsByDay: {
				0: null, // Sunday - Rest
				1: 'fullbody_a', // Monday
				2: null, // Tuesday - Rest
				3: 'fullbody_b', // Wednesday
				4: null, // Thursday - Rest
				5: 'fullbody_c', // Friday
				6: null // Saturday - Rest
			},
			lastWorkoutDay: 5 // Friday
		}
	};

	return schedules[planId] || schedules.ppl;
}

/**
 * Get all completed sessions for a specific week
 * @param {string} uid - User ID
 * @param {number} week - Week number (1-8)
 * @returns {Promise<Array>} Array of completed sessions for that week
 */
async function getCompletedSessionsForWeek(uid, week) {
	try {
		const sessionsRef = collection(db, 'users', uid, 'sessions');
		const q = query(
			sessionsRef,
			where('status', '==', 'completed'),
			where('programWeek', '==', week)
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
	} catch (error) {
		console.error('Error getting completed sessions for week:', error);
		return [];
	}
}

/**
 * Get the current week's start date
 * Returns the Monday of the current week
 */
function getWeekStartDate(date = new Date()) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	const monday = new Date(d.setDate(diff));
	monday.setHours(0, 0, 0, 0);
	return monday;
}

/**
 * Check if a week is completed based on workout schedule
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID (e.g., 'ppl')
 * @param {number} week - Week number
 * @returns {Promise<boolean>} True if all workouts for the week are completed
 */
async function isWeekCompleted(uid, planId, week) {
	try {
		const schedule = getPlanSchedule(planId);
		const completedSessions = await getCompletedSessionsForWeek(uid, week);

		// Count unique workout types completed
		const completedWorkoutTypes = new Set(
			completedSessions.map((s) => s.templateId)
		);

		// Get expected workout types for this plan
		const expectedWorkoutTypes = new Set(
			Object.values(schedule.workoutsByDay).filter((w) => w !== null)
		);

		// Check if we have at least the minimum number of workouts
		// For PPL: need at least 6 workouts (2 push, 2 pull, 2 legs)
		if (completedSessions.length < schedule.totalWorkoutsPerWeek) {
			return false;
		}

		// Verify we have all workout types covered
		for (const workoutType of expectedWorkoutTypes) {
			if (!completedWorkoutTypes.has(workoutType)) {
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error('Error checking week completion:', error);
		return false;
	}
}

/**
 * Check if today is the first day of a new week (Monday)
 * And if the previous week was completed
 */
function isNewWeekStart(date = new Date()) {
	const day = date.getDay();
	return day === 1; // Monday
}

/**
 * Check if we should advance to the next week
 * Called when completing a workout
 *
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {object} completedSession - The session that was just completed
 * @returns {Promise<{ shouldAdvance: boolean, nextWeek: number, completedWeek: number }>}
 */
export async function checkAndAdvanceWeek(uid, planId, completedSession) {
	try {
		const currentWeek = await getProgramWeek(uid, planId);

		// Check if this week is now completed (regardless of which day it is)
		const weekCompleted = await isWeekCompleted(uid, planId, currentWeek);

		if (weekCompleted) {
			// Week is done! Advance to next week
			const nextWeek = await advanceProgramWeek(uid, planId, 8); // Max 8 weeks

			return {
				shouldAdvance: true,
				nextWeek: nextWeek,
				completedWeek: currentWeek,
				message: `Congratulations! You completed Week ${currentWeek}. Week ${nextWeek} starts next workout!`
			};
		}

		return {
			shouldAdvance: false,
			nextWeek: currentWeek,
			completedWeek: currentWeek
		};
	} catch (error) {
		console.error('Error checking week advancement:', error);
		return {
			shouldAdvance: false,
			nextWeek: currentWeek,
			completedWeek: currentWeek
		};
	}
}

/**
 * Get week completion status
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {number} week - Week number
 * @returns {Promise<object>} Status object with completion details
 */
export async function getWeekCompletionStatus(uid, planId, week) {
	try {
		const schedule = getPlanSchedule(planId);
		const completedSessions = await getCompletedSessionsForWeek(uid, week);

		// Count workouts by type
		const workoutCounts = {};
		completedSessions.forEach((session) => {
			const type = session.templateId;
			workoutCounts[type] = (workoutCounts[type] || 0) + 1;
		});

		const totalCompleted = completedSessions.length;
		const totalRequired = schedule.totalWorkoutsPerWeek;
		const isCompleted = await isWeekCompleted(uid, planId, week);

		return {
			week,
			totalCompleted,
			totalRequired,
			workoutCounts,
			isCompleted,
			progress: (totalCompleted / totalRequired) * 100
		};
	} catch (error) {
		console.error('Error getting week completion status:', error);
		return {
			week,
			totalCompleted: 0,
			totalRequired: 6,
			workoutCounts: {},
			isCompleted: false,
			progress: 0
		};
	}
}
