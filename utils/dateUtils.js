// utils/dateUtils.js

export function formatDisplayDate(dateKey) {
	try {
		// dateKey format: "YYYY-MM-DD"
		const [year, month, day] = dateKey.split('-');
		const date = new Date(year, month - 1, day); // month is 0-indexed

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	} catch (e) {
		return dateKey; // fallback to original if parsing fails
	}
}

export function formatTime(iso) {
	if (!iso) return '—';
	const dt = new Date(iso);
	if (Number.isNaN(dt.getTime())) return '—';
	return dt.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function formatLocalDateKey(date = new Date()) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function formatLongDate(date = new Date()) {
	return date.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}
