// utils/workoutStats.js
// Stats + share formatting (no TypeScript)

function safeNum(x) {
	const n = Number(x);
	return Number.isFinite(n) ? n : 0;
}

export function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds == null) return '—';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	if (m < 60) return `${m}m ${s}s`;
	const h = Math.floor(m / 60);
	const rm = m % 60;
	return `${h}h ${rm}m`;
}

export function computeSessionStats(session) {
	const exs = Array.isArray(session?.exercises) ? session.exercises : [];

	let totalSets = 0;
	let totalReps = 0;
	let totalVolume = 0;
	let exercisesCompleted = 0;

	let bestSet = null;

	for (const ex of exs) {
		const sets = Array.isArray(ex.sets) ? ex.sets : [];
		const targetReps = String(ex.targetReps || '').toLowerCase();
		const isTime = targetReps === 'time';
		const isAmrap = targetReps === 'amrap';

		const countedSets = sets.filter((s) => {
			if (s.saved === true) return true;
			return String(s.weight || '').trim() || String(s.reps || '').trim();
		});

		if (countedSets.length) totalSets += countedSets.length;

		const completed =
			sets.length > 0 &&
			(sets.every((s) => s.saved === true) ||
				(sets.every((s) => String(s.reps || '').trim()) &&
					sets.some((s) => String(s.weight || '').trim())) ||
				(isTime && sets.every((s) => String(s.reps || '').trim())) ||
				(isAmrap && sets.every((s) => String(s.reps || '').trim())));

		if (completed) exercisesCompleted += 1;

		for (const s of countedSets) {
			const reps = safeNum(s.reps);
			const weight = safeNum(s.weight);

			if (!isTime) totalReps += reps;

			const volume = isTime ? 0 : weight * reps;
			totalVolume += volume;

			if (!bestSet || volume > bestSet.volume) {
				bestSet = {
					exerciseName: ex.name,
					setIndex: s.setIndex,
					weight,
					reps,
					volume
				};
			}
		}
	}

	let durationSeconds = null;
	if (session?.startedAt && session?.completedAt) {
		const start = new Date(session.startedAt).getTime();
		const end = new Date(session.completedAt).getTime();
		if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
			durationSeconds = Math.floor((end - start) / 1000);
		}
	}

	return {
		totalSets,
		totalReps,
		totalVolume,
		exercisesCompleted,
		exercisesPlanned: exs.length,
		bestSet,
		durationSeconds
	};
}

export function formatSessionForShare(session) {
	if (!session) return 'Workout summary unavailable.';

	const title = session.title || 'Workout';
	const date = session.date || '';
	const tag = session.tag ? `(${session.tag})` : '';
	const stats = computeSessionStats(session);

	const lines = [];
	lines.push(`${title} ${tag}`.trim());
	if (date) lines.push(`Date: ${date}`);
	lines.push('');

	lines.push(
		`Exercises: ${stats.exercisesCompleted}/${stats.exercisesPlanned}`
	);
	lines.push(`Sets: ${stats.totalSets}`);
	lines.push(`Reps: ${stats.totalReps}`);
	lines.push(`Volume: ${Math.round(stats.totalVolume).toLocaleString()} lbs`);
	if (stats.durationSeconds != null)
		lines.push(`Duration: ${formatDuration(stats.durationSeconds)}`);
	if (stats.bestSet) {
		lines.push(
			`Best Set: ${stats.bestSet.exerciseName} — ${stats.bestSet.weight} x ${stats.bestSet.reps}`
		);
	}

	lines.push('');
	lines.push('Breakdown:');

	const exs = Array.isArray(session.exercises) ? session.exercises : [];
	for (const ex of exs) {
		const sets = Array.isArray(ex.sets) ? ex.sets : [];
		const targetReps = String(ex.targetReps || '').toLowerCase();
		const isTime = targetReps === 'time';

		const displaySets = sets.filter((s) => {
			if (s.saved === true) return true;
			return String(s.weight || '').trim() || String(s.reps || '').trim();
		});

		if (displaySets.length === 0) continue;

		const setParts = displaySets.map((s) => {
			const reps = String(s.reps || '—');
			const w = String(s.weight || '—');
			return isTime ? `${reps}s` : `${w}x${reps}`;
		});

		lines.push(`- ${ex.name}: ${setParts.join(', ')}`);
	}

	lines.push('');
	lines.push('Logged with Earned');

	return lines.join('\n');
}
