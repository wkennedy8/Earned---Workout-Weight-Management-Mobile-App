import { formatLocalDateKey } from './dateUtils';

export const PLAN = {
	ppl: {
		id: 'ppl',
		title: 'Push/Pull/Legs',
		description:
			'8-week progressive 6-day split focusing on push, pull, and leg movements',
		workouts: {
			push: {
				id: 'push',
				title: 'Push Workout',
				days: ['Monday', 'Thursday'],
				tag: 'Push',
				exercises: [
					{
						name: 'Incline DB Bench Press',
						// Week 1-2: 3x10, Week 3-4: 4x10, Week 5-6: 4x12, Week 7-8: 5x12
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Incline Barbell Bench Press', difficulty: 'same' },
							{ name: 'Incline Machine Press', difficulty: 'easier' },
							{ name: 'Low Incline DB Press', difficulty: 'same' }
						]
					},
					{
						name: 'Bench Press',
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Dumbbell Bench Press', difficulty: 'same' },
							{ name: 'Machine Chest Press', difficulty: 'easier' },
							{ name: 'Push-ups', difficulty: 'easier' },
							{ name: 'Close Grip Bench Press', difficulty: 'harder' }
						]
					},
					{
						name: 'Seated DB Military Press',
						sets: '3-4',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 3, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 4, reps: 12 }
						],
						alternatives: [
							{ name: 'Standing Military Press', difficulty: 'harder' },
							{ name: 'Machine Shoulder Press', difficulty: 'easier' },
							{ name: 'Arnold Press', difficulty: 'same' },
							{ name: 'Barbell Military Press', difficulty: 'same' }
						]
					},
					{
						name: 'Lateral Raises',
						sets: '3-5',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 4, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 15 },
							{ weeks: [7, 8], sets: 5, reps: 15 }
						],
						alternatives: [
							{ name: 'Cable Lateral Raises', difficulty: 'same' },
							{ name: 'Machine Lateral Raises', difficulty: 'easier' },
							{ name: 'Upright Rows', difficulty: 'same' }
						]
					},
					{
						name: 'Cable Chest Fly',
						sets: '3-4',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 3, reps: 15 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 4, reps: 15 }
						],
						alternatives: [
							{ name: 'Dumbbell Chest Fly', difficulty: 'same' },
							{ name: 'Pec Deck Machine', difficulty: 'easier' },
							{ name: 'Resistance Band Fly', difficulty: 'easier' }
						]
					},
					{
						name: 'Skull Crushers',
						sets: '3-4',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 3, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 4, reps: 12 }
						],
						alternatives: [
							{ name: 'Overhead Triceps Extension', difficulty: 'same' },
							{ name: 'Close Grip Bench Press', difficulty: 'harder' },
							{ name: 'Triceps Dips', difficulty: 'harder' }
						]
					},
					{
						name: 'Rope Pulldowns',
						sets: '3-5',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 4, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 15 },
							{ weeks: [7, 8], sets: 5, reps: 15 }
						],
						alternatives: [
							{ name: 'Overhead Cable Extension', difficulty: 'same' },
							{ name: 'Single Arm Cable Pushdown', difficulty: 'same' },
							{ name: 'Diamond Push-ups', difficulty: 'harder' }
						]
					}
				]
			},
			pull: {
				id: 'pull',
				title: 'Pull Workout',
				days: ['Tuesday', 'Friday'],
				tag: 'Pull',
				exercises: [
					{
						name: 'Pullups',
						sets: '3-5',
						reps: 'AMRAP',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 'AMRAP' },
							{ weeks: [3, 4], sets: 4, reps: 'AMRAP' },
							{ weeks: [5, 6], sets: 4, reps: 'AMRAP' },
							{ weeks: [7, 8], sets: 5, reps: 'AMRAP' }
						],
						alternatives: [
							{ name: 'Assisted Pullups', difficulty: 'easier' },
							{ name: 'Chin-ups', difficulty: 'same' },
							{ name: 'Weighted Pullups', difficulty: 'harder' }
						]
					},
					{
						name: 'High Row',
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Cable High Row', difficulty: 'same' },
							{ name: 'Chest Supported Row', difficulty: 'easier' },
							{ name: 'T-Bar Row', difficulty: 'same' }
						]
					},
					{
						name: 'Lat Pulldown',
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Wide Grip Pulldown', difficulty: 'same' },
							{ name: 'Close Grip Pulldown', difficulty: 'same' },
							{ name: 'Single Arm Pulldown', difficulty: 'harder' }
						]
					},
					{
						name: 'Seated Cable Row',
						sets: '3-4',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 3, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 4, reps: 12 }
						],
						alternatives: [
							{ name: 'Barbell Row', difficulty: 'harder' },
							{ name: 'Dumbbell Row', difficulty: 'same' },
							{ name: 'Machine Row', difficulty: 'easier' },
							{ name: 'Inverted Rows', difficulty: 'same' }
						]
					},
					{
						name: 'Rear Delt Cable Fly',
						sets: '3-5',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 4, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 15 },
							{ weeks: [7, 8], sets: 5, reps: 15 }
						],
						alternatives: [
							{ name: 'Reverse Pec Deck', difficulty: 'easier' },
							{ name: 'Face Pulls', difficulty: 'same' },
							{ name: 'Bent Over Rear Delt Raise', difficulty: 'same' }
						]
					},
					{
						name: 'Hammer Curls',
						sets: '3-4',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 3, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 4, reps: 12 }
						],
						alternatives: [
							{ name: 'Dumbbell Curls', difficulty: 'same' },
							{ name: 'Cable Curls', difficulty: 'same' },
							{ name: 'Concentration Curls', difficulty: 'same' }
						]
					},
					{
						name: 'Preacher Curls',
						sets: '3-4',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 3, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 4, reps: 12 }
						],
						alternatives: [
							{ name: 'Machine Preacher Curls', difficulty: 'easier' },
							{ name: 'Cable Preacher Curls', difficulty: 'same' },
							{ name: 'Spider Curls', difficulty: 'same' }
						]
					}
				]
			},
			legs_abs: {
				id: 'legs_abs',
				title: 'Legs / Abs Workout',
				days: ['Wednesday', 'Saturday'],
				tag: 'Legs',
				exercises: [
					{
						name: 'Squat',
						sets: '3-5',
						reps: '8-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 8 },
							{ weeks: [3, 4], sets: 4, reps: 8 },
							{ weeks: [5, 6], sets: 4, reps: 10 },
							{ weeks: [7, 8], sets: 5, reps: 10 }
						],
						alternatives: [
							{ name: 'Front Squat', difficulty: 'harder' },
							{ name: 'Leg Press', difficulty: 'easier' },
							{ name: 'Goblet Squat', difficulty: 'easier' },
							{ name: 'Bulgarian Split Squat', difficulty: 'harder' }
						]
					},
					{
						name: 'Leg Extensions',
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Sissy Squat', difficulty: 'harder' },
							{ name: 'Walking Lunges', difficulty: 'same' }
						]
					},
					{
						name: 'Seated Leg Curl',
						sets: '3-5',
						reps: '10-12',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 10 },
							{ weeks: [3, 4], sets: 4, reps: 10 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 5, reps: 12 }
						],
						alternatives: [
							{ name: 'Lying Leg Curl', difficulty: 'same' },
							{ name: 'Standing Leg Curl', difficulty: 'same' },
							{ name: 'Romanian Deadlift', difficulty: 'harder' }
						]
					},
					{
						name: 'Standing Calf Raises',
						sets: '3-5',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 4, reps: 12 },
							{ weeks: [5, 6], sets: 4, reps: 15 },
							{ weeks: [7, 8], sets: 5, reps: 15 }
						],
						alternatives: [
							{ name: 'Seated Calf Raises', difficulty: 'easier' },
							{ name: 'Calf Press on Leg Press', difficulty: 'same' },
							{ name: 'Single Leg Calf Raises', difficulty: 'harder' }
						]
					},
					{
						name: 'Cable Crunch',
						sets: '3-4',
						reps: '12-15',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: 12 },
							{ weeks: [3, 4], sets: 3, reps: 15 },
							{ weeks: [5, 6], sets: 4, reps: 12 },
							{ weeks: [7, 8], sets: 4, reps: 15 }
						],
						alternatives: [
							{ name: 'Weighted Crunch', difficulty: 'same' },
							{ name: 'Ab Wheel Rollout', difficulty: 'harder' },
							{ name: 'Hanging Leg Raises', difficulty: 'harder' }
						]
					},
					{
						name: 'Plank',
						sets: '3-4',
						reps: 'time',
						note: 'Week 1-2: 30 sec, Week 3-4: 40 sec, Week 5-6: 50 sec, Week 7-8: 60 sec',
						weeklyProgression: [
							{ weeks: [1, 2], sets: 3, reps: '30 sec' },
							{ weeks: [3, 4], sets: 3, reps: '40 sec' },
							{ weeks: [5, 6], sets: 4, reps: '50 sec' },
							{ weeks: [7, 8], sets: 4, reps: '60 sec' }
						],
						alternatives: [
							{ name: 'Side Plank', difficulty: 'same' },
							{ name: 'RKC Plank', difficulty: 'harder' },
							{ name: 'Plank with Shoulder Taps', difficulty: 'harder' }
						]
					}
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
	},
	bro_split: {
		id: 'bro_split',
		title: 'Bro Split (5-Day Split)',
		description: '5-day split targeting one major muscle group per session',
		workouts: {
			chest: {
				id: 'chest',
				title: 'Chest Day',
				days: ['Monday'],
				tag: 'Chest',
				exercises: [
					{ name: 'Barbell Bench Press', sets: '4', reps: '8-10' },
					{ name: 'Incline DB Bench Press', sets: '4', reps: '10-12' },
					{ name: 'Decline Barbell Bench Press', sets: '3', reps: '10-12' },
					{ name: 'Cable Chest Fly', sets: '3', reps: '12-15' },
					{ name: 'Incline DB Fly', sets: '3', reps: '12-15' },
					{ name: 'Chest Dips', sets: '3', reps: 'AMRAP' },
					{ name: 'Push-ups', sets: '3', reps: 'AMRAP', note: 'Burnout set' }
				]
			},
			back: {
				id: 'back',
				title: 'Back Day',
				days: ['Tuesday'],
				tag: 'Back',
				exercises: [
					{ name: 'Deadlift', sets: '4', reps: '6-8' },
					{ name: 'Barbell Row', sets: '4', reps: '8-10' },
					{ name: 'Pullups', sets: '4', reps: 'AMRAP' },
					{ name: 'Lat Pulldown', sets: '3', reps: '10-12' },
					{ name: 'Seated Cable Row', sets: '3', reps: '10-12' },
					{ name: 'Single Arm DB Row', sets: '3', reps: '12-15' },
					{ name: 'Face Pulls', sets: '3', reps: '15-20' }
				]
			},
			shoulders: {
				id: 'shoulders',
				title: 'Shoulder Day',
				days: ['Wednesday'],
				tag: 'Shoulders',
				exercises: [
					{ name: 'Seated Barbell Military Press', sets: '4', reps: '8-10' },
					{ name: 'Seated DB Shoulder Press', sets: '4', reps: '10-12' },
					{ name: 'Lateral Raises', sets: '4', reps: '12-15' },
					{ name: 'Front Raises', sets: '3', reps: '12-15' },
					{ name: 'Rear Delt Cable Fly', sets: '4', reps: '12-15' },
					{ name: 'Upright Rows', sets: '3', reps: '10-12' },
					{ name: 'DB Shrugs', sets: '3', reps: '12-15' }
				]
			},
			legs: {
				id: 'legs',
				title: 'Leg Day',
				days: ['Thursday'],
				tag: 'Legs',
				exercises: [
					{ name: 'Back Squat', sets: '4', reps: '8-10' },
					{ name: 'Leg Press', sets: '4', reps: '10-12' },
					{ name: 'Romanian Deadlift', sets: '3', reps: '10-12' },
					{ name: 'Leg Extensions', sets: '3', reps: '12-15' },
					{ name: 'Seated Leg Curl', sets: '3', reps: '12-15' },
					{ name: 'Walking Lunges', sets: '3', reps: '12-15' },
					{ name: 'Standing Calf Raises', sets: '4', reps: '15-20' },
					{ name: 'Seated Calf Raises', sets: '3', reps: '15-20' }
				]
			},
			arms_abs: {
				id: 'arms_abs',
				title: 'Arms & Abs Day',
				days: ['Friday'],
				tag: 'Arms',
				exercises: [
					{ name: 'Barbell Curls', sets: '4', reps: '10-12' },
					{ name: 'Close Grip Bench Press', sets: '4', reps: '10-12' },
					{ name: 'Hammer Curls', sets: '3', reps: '10-12' },
					{ name: 'Skull Crushers', sets: '3', reps: '10-12' },
					{ name: 'Preacher Curls', sets: '3', reps: '12-15' },
					{ name: 'Rope Triceps Pushdowns', sets: '3', reps: '12-15' },
					{ name: 'Cable Curls', sets: '3', reps: '12-15' },
					{
						name: 'Overhead Cable Triceps Extension',
						sets: '3',
						reps: '12-15'
					},
					{ name: 'Cable Crunch', sets: '4', reps: '15-20' },
					{ name: 'Hanging Leg Raises', sets: '3', reps: '12-15' },
					{ name: 'Plank', sets: '3', reps: 'time', note: '+5 sec each week' }
				]
			}
		}
	}
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
