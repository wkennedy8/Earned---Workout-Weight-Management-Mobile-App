// utils/numberUtils.js

export function normalizeNumberText(text, { decimals = 1 } = {}) {
	const cleaned = String(text || '').replace(/[^\d.]/g, '');
	const parts = cleaned.split('.');
	if (parts.length <= 1) return cleaned;
	return `${parts[0]}.${parts.slice(1).join('').slice(0, decimals)}`;
}

export function isFiniteNumberString(value) {
	const n = Number(value);
	return Number.isFinite(n);
}

export function normalizeWeightInput(text) {
	// Remove everything except digits and decimal point
	const cleaned = text.replace(/[^\d.]/g, '');

	// Split by decimal point
	const parts = cleaned.split('.');

	// If no decimal point, return as-is
	if (parts.length <= 1) return cleaned;

	// If decimal point exists, keep first part + decimal + first digit after
	return `${parts[0]}.${parts.slice(1).join('').slice(0, 1)}`;
}

export function isValidWeightNumber(text) {
	const trimmed = String(text || '').trim();
	if (!trimmed) return false;

	const num = Number(trimmed);
	return Number.isFinite(num) && num > 0;
}

export function toFixed1(number) {
	const num = Number(number);
	if (!Number.isFinite(num)) return '0.0';
	return num.toFixed(1);
}

/**
 * Format duration in seconds to readable format
 * Examples: "45s", "2m 30s", "1h 15m"
 */
export function formatDuration(seconds) {
	if (!seconds || seconds < 0) return '0s';

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}

	if (minutes > 0) {
		return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
	}

	return `${secs}s`;
}
