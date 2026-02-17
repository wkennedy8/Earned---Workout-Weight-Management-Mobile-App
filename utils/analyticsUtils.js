/**
 * Calculate workout streak based on consecutive days
 */
export function calculateStreak(sessions) {
	if (!sessions.length) return 0;

	const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
	const uniqueDates = [...new Set(sorted.map((s) => s.date))];

	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < uniqueDates.length; i++) {
		const sessionDate = new Date(uniqueDates[i]);
		sessionDate.setHours(0, 0, 0, 0);

		const diffTime = today - sessionDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (i === 0) {
			if (diffDays === 0 || diffDays === 1) {
				streak++;
			} else {
				break;
			}
		} else {
			const prevDate = new Date(uniqueDates[i - 1]);
			prevDate.setHours(0, 0, 0, 0);

			const daysBetween = Math.floor(
				(prevDate - sessionDate) / (1000 * 60 * 60 * 24)
			);

			if (daysBetween === 1) {
				streak++;
			} else {
				break;
			}
		}
	}
	return streak;
}

/**
 * Calculate cardio streak (weekly basis)
 */
export function calculateCardioStreak(sessions) {
	if (!sessions.length) return 0;

	const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
	const uniqueDates = [...new Set(sorted.map((s) => s.date))];

	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < uniqueDates.length; i++) {
		const sessionDate = new Date(uniqueDates[i]);
		sessionDate.setHours(0, 0, 0, 0);

		const diffTime = today - sessionDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (i === 0) {
			if (diffDays <= 7) {
				streak++;
			} else {
				break;
			}
		} else {
			const prevDate = new Date(uniqueDates[i - 1]);
			prevDate.setHours(0, 0, 0, 0);

			const daysBetween = Math.floor(
				(prevDate - sessionDate) / (1000 * 60 * 60 * 24)
			);

			if (daysBetween <= 7) {
				streak++;
			} else {
				break;
			}
		}
	}
	return streak;
}

/**
 * Group sessions by program week
 */
export function groupSessionsByWeek(sessions) {
	const weekMap = {};

	sessions.forEach((session) => {
		const week = session.programWeek || null;
		if (week) {
			if (!weekMap[week]) {
				weekMap[week] = [];
			}
			weekMap[week].push(session);
		}
	});

	return weekMap;
}

/**
 * Calculate stats for a specific week
 */
export function calculateWeekStats(sessions, computeSessionStats) {
	let volumeSum = 0;
	let setsSum = 0;
	let repsSum = 0;

	sessions.forEach((session) => {
		const stats = computeSessionStats(session);
		volumeSum += stats.totalVolume;
		setsSum += stats.totalSets;
		repsSum += stats.totalReps;
	});

	return {
		workouts: sessions.length,
		volume: volumeSum,
		sets: setsSum,
		reps: repsSum,
		avgVolume: sessions.length > 0 ? volumeSum / sessions.length : 0
	};
}

/**
 * Sample weight data to prevent chart overcrowding
 */
export function sampleWeights(data, range) {
	if (data.length === 0) return data;

	const rangeNum = parseInt(range);
	let sampleRate = 1;

	if (rangeNum === 7) {
		sampleRate = 1;
	} else if (rangeNum === 30) {
		sampleRate = Math.ceil(data.length / 15);
	} else if (rangeNum === 90) {
		sampleRate = Math.ceil(data.length / 12);
	}

	if (data.length <= 2) return data;

	const sampled = [data[0]];
	for (let i = sampleRate; i < data.length - 1; i += sampleRate) {
		sampled.push(data[i]);
	}
	sampled.push(data[data.length - 1]);

	return sampled;
}

/**
 * Prepare chart data with intelligent label spacing
 */
export function prepareChartData(sampledWeights) {
	return {
		labels:
			sampledWeights.length > 0
				? sampledWeights
						.slice()
						.reverse()
						.map((w, index, array) => {
							const totalPoints = array.length;
							let showEvery = 1;

							if (totalPoints > 12) {
								showEvery = Math.ceil(totalPoints / 6);
							} else if (totalPoints > 7) {
								showEvery = 2;
							}

							if (
								index === 0 ||
								index === array.length - 1 ||
								index % showEvery === 0
							) {
								const d = new Date(w.date);
								return `${d.getMonth() + 1}/${d.getDate()}`;
							}
							return '';
						})
				: [''],
		datasets: [
			{
				data:
					sampledWeights.length > 0
						? sampledWeights
								.slice()
								.reverse()
								.map((w) => w.weight)
						: [0]
			}
		]
	};
}
