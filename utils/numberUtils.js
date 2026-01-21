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
