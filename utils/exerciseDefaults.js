export function defaultSetCount(setsStr) {
	const first = String(setsStr).split('-')[0];
	const n = Number(first);
	return Number.isFinite(n) && n > 0 ? n : 3;
}
