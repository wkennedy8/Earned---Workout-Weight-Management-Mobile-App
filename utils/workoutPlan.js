import { formatLocalDateKey } from './dateUtils';

export const PLAN = {
	ppl: {
		id: 'ppl',
		title: 'Push/Pull/Legs',
		description: '6-day split focusing on push, pull, and leg movements',
		workouts: {
			push: {
				id: 'push',
				title: 'Push Workout',
				days: ['Monday', 'Thursday'],
				tag: 'Push',
				exercises: [
					{ name: 'Incline DB Bench Press', sets: '3-4', reps: '12' },
					{ name: 'Bench Press', sets: '3-4', reps: '12' },
					{ name: 'Seated DB Military Press', sets: '3-4', reps: '12' },
					{ name: 'Lateral Raises', sets: '3-4', reps: '15' },
					{ name: 'Cable Chest Fly', sets: '3-4', reps: '15' },
					{ name: 'Skull Crushers', sets: '3-4', reps: '12' },
					{ name: 'Rope Pulldowns', sets: '3-4', reps: '15' }
				]
			},
			pull: {
				id: 'pull',
				title: 'Pull Workout',
				days: ['Tuesday', 'Friday'],
				tag: 'Pull',
				exercises: [
					{ name: 'Pullups', sets: '3-4', reps: 'AMRAP' },
					{ name: 'High Row', sets: '3-4', reps: '12' },
					{ name: 'Lat Pulldown', sets: '3-4', reps: '12' },
					{ name: 'Seated Cable Row', sets: '3-4', reps: '12' },
					{ name: 'Rear Delt Cable Fly', sets: '3-4', reps: '15' },
					{ name: 'Hammer Curls', sets: '3-4', reps: '12' },
					{ name: 'Preacher Curls', sets: '3-4', reps: '12' }
				]
			},
			legs_abs: {
				id: 'legs_abs',
				title: 'Legs / Abs Workout',
				days: ['Wednesday', 'Saturday'],
				tag: 'Legs',
				exercises: [
					{ name: 'Squat', sets: '3-4', reps: '12' },
					{ name: 'Leg Extensions', sets: '3-4', reps: '12' },
					{ name: 'Seated Leg Curl', sets: '3-4', reps: '12' },
					{ name: 'Standing Calf Raises', sets: '3-4', reps: '15' },
					{ name: 'Cable Crunch', sets: '3-4', reps: '15' },
					{ name: 'Plank', sets: '3', reps: 'time', note: '+5 sec each week' }
				]
			}
		}
	},
	fullbody_3day: {
		id: 'fullbody_3day',
		title: 'Full Body (3-Day Split)',
		description:
			'3-day split focusing on full-body training with evenly distributed sessions',
		workouts: {
			fullbody_a: {
				id: 'fullbody_a',
				title: 'Full Body A',
				days: ['Monday'],
				tag: 'Full Body',
				exercises: [
					{ name: 'Back Squat', sets: '3-4', reps: '8-12' },
					{ name: 'Bench Press', sets: '3-4', reps: '8-12' },
					{ name: 'Barbell Row', sets: '3-4', reps: '10-12' },
					{ name: 'Romanian Deadlift', sets: '3-4', reps: '8-12' },
					{ name: 'Lateral Raises', sets: '3-4', reps: '12-15' },
					{ name: 'Rope Triceps Pushdowns', sets: '3-4', reps: '12-15' },
					{ name: 'Hammer Curls', sets: '3-4', reps: '10-12' },
					{ name: 'Plank', sets: '3', reps: 'time', note: '+5 sec each week' }
				]
			},
			fullbody_b: {
				id: 'fullbody_b',
				title: 'Full Body B',
				days: ['Wednesday'],
				tag: 'Full Body',
				exercises: [
					{
						name: 'Deadlift (Conventional or Trap Bar)',
						sets: '3-4',
						reps: '5-8'
					},
					{ name: 'Incline DB Bench Press', sets: '3-4', reps: '8-12' },
					{ name: 'Lat Pulldown', sets: '3-4', reps: '10-12' },
					{ name: 'Walking Lunges', sets: '3-4', reps: '10-12' },
					{ name: 'Seated DB Shoulder Press', sets: '3-4', reps: '8-12' },
					{ name: 'Rear Delt Cable Fly', sets: '3-4', reps: '12-15' },
					{ name: 'Skull Crushers', sets: '3-4', reps: '10-12' },
					{ name: 'Cable Crunch', sets: '3-4', reps: '12-15' }
				]
			},
			fullbody_c: {
				id: 'fullbody_c',
				title: 'Full Body C',
				days: ['Friday'],
				tag: 'Full Body',
				exercises: [
					{ name: 'Leg Press', sets: '3-4', reps: '10-12' },
					{ name: 'Pullups', sets: '3-4', reps: 'AMRAP' },
					{ name: 'DB Bench Press', sets: '3-4', reps: '8-12' },
					{ name: 'Seated Cable Row', sets: '3-4', reps: '10-12' },
					{ name: 'Seated Leg Curl', sets: '3-4', reps: '10-12' },
					{ name: 'Standing Calf Raises', sets: '3-4', reps: '12-15' },
					{ name: 'Preacher Curls', sets: '3-4', reps: '10-12' },
					{
						name: 'Overhead Cable Triceps Extension',
						sets: '3-4',
						reps: '12-15'
					}
				]
			}
		}
	}
	// Add more plans here in the future, e.g.:
	// upper_lower: { ... },
	// full_body: { ... }
};

export function getDayName(date = new Date()) {
	return date.toLocaleDateString(undefined, { weekday: 'long' });
}

// Helper function to get workout for a specific date
export function getWorkoutForDate(date) {
	const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

	// For now, only PPL plan is supported
	const pplPlan = PLAN.ppl;

	if (!pplPlan || !pplPlan.workouts) {
		console.warn('PPL plan not found');
		return {
			id: 'rest',
			title: 'Rest Day',
			tag: 'Rest',
			exercises: []
		};
	}

	// Find which workout is scheduled for this day
	for (const workout of Object.values(pplPlan.workouts)) {
		if (workout && workout.days && workout.days.includes(dayOfWeek)) {
			return workout;
		}
	}

	// Rest day
	return {
		id: 'rest',
		title: 'Rest Day',
		tag: 'Rest',
		exercises: []
	};
}

export function tagColor(tag) {
	if (tag === 'Push') return '#F97316';
	if (tag === 'Pull') return '#10B981';
	if (tag === 'Legs') return '#8B5CF6';
	return '#6B7280';
}

// Helper function to get workout for a specific date FROM A SPECIFIC PLAN
export function getWorkoutForDateFromPlan(date, plan) {
	const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

	if (!plan || !plan.workouts) {
		return {
			id: 'rest',
			title: 'Rest Day',
			tag: 'Rest',
			exercises: []
		};
	}

	// Find which workout is scheduled for this day
	for (const workout of Object.values(plan.workouts)) {
		if (workout && workout.days && workout.days.includes(dayOfWeek)) {
			return workout;
		}
	}

	// Rest day
	return {
		id: 'rest',
		title: 'Rest Day',
		tag: 'Rest',
		exercises: []
	};
}

import { getScheduleOverride } from '@/controllers/rescheduleController';

/**
 * Get workout for a specific date with override support (async)
 * Checks for schedule overrides first, then falls back to regular schedule
 */
export async function getWorkoutForDateWithOverride(date, plan, uid) {
	const dateKey = formatLocalDateKey(date);

	// Check for schedule override first
	const override = await getScheduleOverride(uid, dateKey);

	if (override) {
		if (override.workoutId === 'rest') {
			return {
				id: 'rest',
				title: 'Rest Day',
				tag: 'Rest',
				exercises: []
			};
		}

		// Find the workout by ID in the plan
		if (plan.workouts && plan.workouts[override.workoutId]) {
			return plan.workouts[override.workoutId];
		}

		// If not found in current plan, search all plans
		for (const planObj of Object.values(PLAN)) {
			if (planObj.workouts && planObj.workouts[override.workoutId]) {
				return planObj.workouts[override.workoutId];
			}
		}
	}

	// Fall back to regular schedule
	return getWorkoutForDateFromPlan(date, plan);
}
