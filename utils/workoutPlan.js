// utils/workoutPlan.js
// Plan + day-based selection (no TypeScript)

export const PLAN = {
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
};

export function getDayName(date = new Date()) {
	return date.toLocaleDateString(undefined, { weekday: 'long' });
}

export function getWorkoutForDate(date = new Date()) {
	const dayName = getDayName(date);

	if (PLAN.push.days.includes(dayName)) return PLAN.push;
	if (PLAN.pull.days.includes(dayName)) return PLAN.pull;
	if (PLAN.legs_abs.days.includes(dayName)) return PLAN.legs_abs;

	return { id: 'rest', title: 'Rest / Recovery', tag: 'Rest', exercises: [] };
}

export function tagColor(tag) {
	if (tag === 'Push') return '#F97316';
	if (tag === 'Pull') return '#10B981';
	if (tag === 'Legs') return '#8B5CF6';
	return '#6B7280';
}
