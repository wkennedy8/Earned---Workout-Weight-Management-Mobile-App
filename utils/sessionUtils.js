/**
 * Check if an exercise is completed (all sets saved)
 */
export function isExerciseCompleted(exercise) {
	return (
		exercise.sets.length > 0 && exercise.sets.every((s) => s.saved === true)
	);
}

/**
 * Check if target reps is numeric (not AMRAP or time)
 */
export function isNumericTargetReps(targetReps) {
	const t = String(targetReps || '')
		.trim()
		.toLowerCase();
	if (t === 'amrap' || t === 'time') return false;
	return Number.isFinite(Number(t));
}

/**
 * Validate a set before saving
 */
export function validateSetBeforeSave(exercise, set) {
	const isTime = String(exercise.targetReps).toLowerCase() === 'time';
	const isAmrap = String(exercise.targetReps).toLowerCase() === 'amrap';

	const requiresWeight = !(isTime || isAmrap);

	if (requiresWeight && !String(set.weight).trim()) return 'Enter a weight.';
	if (!String(set.reps).trim())
		return isTime ? 'Enter seconds.' : 'Enter reps.';

	if (requiresWeight && !Number.isFinite(Number(set.weight)))
		return 'Weight must be a number.';
	if (!Number.isFinite(Number(set.reps)))
		return isTime ? 'Seconds must be a number.' : 'Reps must be a number.';

	return null;
}
