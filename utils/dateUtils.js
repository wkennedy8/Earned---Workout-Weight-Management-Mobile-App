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

/**
 * Convert 24-hour time to 12-hour format for display
 * "20:00" → "8:00 PM"
 */
export function format12Hour(time24) {
	if (!time24) return '';

	const [hours, minutes] = time24.split(':').map(Number);
	const period = hours >= 12 ? 'PM' : 'AM';
	const hours12 = hours % 12 || 12; // Convert 0 to 12

	return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Generate array of time options for picker
 * Returns array of objects: [{ value: "06:00", label: "6:00 AM" }, ...]
 */
export function getTimePickerOptions() {
	const options = [];

	for (let hour = 6; hour <= 23; hour++) {
		const time24 = `${hour.toString().padStart(2, '0')}:00`;
		const label = format12Hour(time24);
		options.push({ value: time24, label });
	}

	return options;
}
