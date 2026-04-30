import { db } from '@/lib/firebase';
import { PLAN } from '@/utils/workoutPlan';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
	advanceProgramWeek,
	completeProgramCycle,
	getProgramProgress
} from './programProgressController';

/**
 * Derive the set of required workout type IDs directly from the plan definition.
 * e.g. PPL → Set { 'push', 'pull', 'legs_abs' }
 */
function getRequiredWorkoutTypes(planId) {
	const plan = PLAN[planId];
	if (!plan?.workouts) return new Set();
	return new Set(Object.keys(plan.workouts));
}

/**
 * Get all completed sessions tagged with a given program week.
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
 * A week is complete when the user has logged at least one session for every
 * required workout type (e.g. push, pull, legs_abs for PPL).
 * For plans where each type appears twice per week (PPL), one session per type
 * is enough — missing the second session shouldn't block advancement.
 */
async function isWeekCompleted(uid, planId, week) {
	try {
		const requiredTypes = getRequiredWorkoutTypes(planId);
		if (requiredTypes.size === 0) return false;

		const completedSessions = await getCompletedSessionsForWeek(uid, week);
		const completedTypes = new Set(completedSessions.map((s) => s.templateId));

		for (const type of requiredTypes) {
			if (!completedTypes.has(type)) return false;
		}

		return true;
	} catch (error) {
		console.error('Error checking week completion:', error);
		return false;
	}
}

/**
 * Calculate whether the 7-day window for a given program week has elapsed.
 * Week N runs from startDate + (N-1)*7 days to startDate + N*7 days.
 */
function isWeekTimedOut(startDate, currentWeek) {
	if (!startDate) return false;
	const weekEnd = new Date(startDate);
	weekEnd.setDate(weekEnd.getDate() + currentWeek * 7);
	return new Date() > weekEnd;
}

/**
 * Check if we should advance to the next week after a session is completed.
 * Advances if:
 *   - The user has completed at least one session of every workout type, OR
 *   - 7 days have elapsed since this program week started (time-based fallback)
 *
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @returns {Promise<{ shouldAdvance: boolean, programCompleted: boolean, timedOut: boolean, nextWeek: number, completedWeek: number, message: string }>}
 */
export async function checkAndAdvanceWeek(uid, planId) {
	try {
		const progress = await getProgramProgress(uid, planId);
		const currentWeek = progress.currentWeek;

		const [workoutsComplete, timedOut] = await Promise.all([
			isWeekCompleted(uid, planId, currentWeek),
			Promise.resolve(isWeekTimedOut(progress.startDate, currentWeek))
		]);

		if (workoutsComplete || timedOut) {
			if (currentWeek >= 8) {
				await completeProgramCycle(uid, planId);
				return {
					shouldAdvance: false,
					programCompleted: true,
					timedOut: timedOut && !workoutsComplete,
					nextWeek: currentWeek,
					completedWeek: currentWeek,
					message: 'Congratulations! You completed the full 8-week program!'
				};
			}

			const nextWeek = await advanceProgramWeek(uid, planId);
			const message =
				timedOut && !workoutsComplete
					? `Week ${currentWeek} window ended. Moving to Week ${nextWeek}.`
					: `Week ${currentWeek} complete! Week ${nextWeek} starts next workout.`;

			return {
				shouldAdvance: true,
				programCompleted: false,
				timedOut: timedOut && !workoutsComplete,
				nextWeek,
				completedWeek: currentWeek,
				message
			};
		}

		return {
			shouldAdvance: false,
			programCompleted: false,
			timedOut: false,
			nextWeek: currentWeek,
			completedWeek: currentWeek
		};
	} catch (error) {
		console.error('Error checking week advancement:', error);
		return {
			shouldAdvance: false,
			programCompleted: false,
			timedOut: false,
			nextWeek: 1,
			completedWeek: 1
		};
	}
}

/**
 * Get week completion status for display purposes (e.g. progress indicators).
 * @param {string} uid - User ID
 * @param {string} planId - Plan ID
 * @param {number} week - Week number
 * @returns {Promise<object>}
 */
export async function getWeekCompletionStatus(uid, planId, week) {
	try {
		const requiredTypes = getRequiredWorkoutTypes(planId);
		const completedSessions = await getCompletedSessionsForWeek(uid, week);

		const completedCounts = {};
		completedSessions.forEach((session) => {
			const type = session.templateId;
			completedCounts[type] = (completedCounts[type] || 0) + 1;
		});

		const completedTypes = new Set(Object.keys(completedCounts));
		const totalRequired = requiredTypes.size;
		const totalCompleted = [...requiredTypes].filter((t) =>
			completedTypes.has(t)
		).length;

		return {
			week,
			totalCompleted,
			totalRequired,
			completedCounts,
			isCompleted: totalCompleted >= totalRequired,
			progress: totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0
		};
	} catch (error) {
		console.error('Error getting week completion status:', error);
		return {
			week,
			totalCompleted: 0,
			totalRequired: 0,
			completedCounts: {},
			isCompleted: false,
			progress: 0
		};
	}
}
