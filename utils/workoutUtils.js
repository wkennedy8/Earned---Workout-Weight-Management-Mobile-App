/**
 * Parse sets string and return default count
 */
export function defaultSetCount(setsStr) {
	const first = String(setsStr).split('-')[0];
	const n = Number(first);
	return Number.isFinite(n) && n > 0 ? n : 3;
}

/**
 * Normalize exercise name to consistent key
 */
export function normalizeExerciseKey(name) {
	return String(name || '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' '); // collapse whitespace
}

/**
 * Normalize numeric input with decimal control
 */
export function normalizeNumberText(text, { decimals = 1 } = {}) {
	// Remove everything except digits and decimal point
	const cleaned = text.replace(/[^\d.]/g, '');

	// Split by decimal point
	const parts = cleaned.split('.');

	// If no decimal point, return as-is
	if (parts.length <= 1) return cleaned;

	// Keep first part + decimal + limited decimal places
	return `${parts[0]}.${parts.slice(1).join('').slice(0, decimals)}`;
}

/**
 * Get color for workout tag
 */
export function tagColor(tag) {
	if (tag === 'Push') return '#F97316';
	if (tag === 'Pull') return '#10B981';
	if (tag === 'Legs') return '#8B5CF6';
	return '#6B7280';
}
