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

/**
 * Format phone number as user types
 * Converts: 5551234567 → (555) 123-4567
 */
export function formatPhoneNumber(value) {
	if (!value) return '';

	// Remove all non-digits
	const cleaned = value.replace(/\D/g, '');

	// Limit to 10 digits
	const limited = cleaned.slice(0, 10);

	// Format based on length
	if (limited.length <= 3) {
		return limited;
	} else if (limited.length <= 6) {
		return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
	} else {
		return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
	}
}

/**
 * Validate phone number format
 * Requires exactly 10 digits
 */
export function isValidPhoneNumber(formatted) {
	if (!formatted) return true; // Empty is valid (optional field)
	const cleaned = formatted.replace(/\D/g, '');
	return cleaned.length === 10;
}

/**
 * Extract raw digits from formatted phone number
 * (555) 123-4567 → 5551234567
 */
export function cleanPhoneNumber(formatted) {
	if (!formatted) return '';
	return formatted.replace(/\D/g, '');
}
