// utils/weightUtils.js
// Shared helpers for weight tracking (no TypeScript)

export function toFixed1(n) {
	return (Math.round(Number(n || 0) * 10) / 10).toFixed(1);
}

export function sortByDateAsc(entries) {
	return [...(entries || [])].sort((a, b) =>
		String(a.date).localeCompare(String(b.date))
	);
}

export function avgWeight(entries) {
	if (!entries?.length) return null;
	const sum = entries.reduce((acc, e) => acc + Number(e.weight || 0), 0);
	return sum / entries.length;
}

/**
 * Stall logic:
 * - Requires 14+ entries (2 weeks)
 * - Compare avg of last 7 days vs avg of previous 7 days
 * - If weekly loss is < 0.5 lbs, consider it stalled
 *
 * weeklyLoss = prev7Avg - last7Avg
 */
export function shouldSuggestMacroCut(entries) {
	const asc = sortByDateAsc(entries);
	if (asc.length < 14) return { eligible: false };

	const last7 = asc.slice(asc.length - 7);
	const prev7 = asc.slice(asc.length - 14, asc.length - 7);

	const last7Avg = avgWeight(last7);
	const prev7Avg = avgWeight(prev7);

	if (last7Avg == null || prev7Avg == null) return { eligible: false };

	const weeklyLoss = prev7Avg - last7Avg; // positive means loss
	const stalled = weeklyLoss < 0.5;

	return {
		eligible: true,
		stalled,
		weeklyLoss,
		prev7Avg,
		last7Avg
	};
}

export function getFirstEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	const copy = sortByDateAsc(entries);
	return copy[0] || null;
}

export function getLatestEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	const copy = [...entries].sort((a, b) =>
		String(b.date).localeCompare(String(a.date))
	);
	return copy[0] || null;
}

export function formatLocalDateKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatDisplayDate(yyyyMmDd) {
	const [y, m, d] = String(yyyyMmDd)
		.split('-')
		.map((x) => Number(x));
	const dt = new Date(y, m - 1, d);
	return dt.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function getTimeBasedGreeting(name) {
	const hour = new Date().getHours();
	if (hour < 12) return `Good Morning ${name}`;
	if (hour < 18) return `Good Afternoon ${name}`;
	return `Good Evening ${name}`;
}

export function normalizeWeightInput(text) {
	const cleaned = String(text || '').replace(/[^\d.]/g, '');
	const parts = cleaned.split('.');
	if (parts.length <= 1) return cleaned;
	return `${parts[0]}.${parts.slice(1).join('').slice(0, 1)}`; // 1 decimal
}

export function isValidWeightNumber(value) {
	if (!value) return false;
	const n = Number(value);
	if (!Number.isFinite(n)) return false;
	return n >= 50 && n <= 800;
}
