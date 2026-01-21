// utils/workoutSessionFactory.js
import { loadExerciseDefaults, normalizeExerciseKey } from './exerciseDefaults';
import { loadAllSessions, upsertSession } from './sessionStorage';

/**
 * Normalizes session for UI:
 * - ensures expanded exists
 * - ensures saved/savedAt exist (backward compat)
 * - prefills empty weights with defaults (only if not saved)
 */
export function normalizeSessionForUI({ session, defaults, openFirst = true }) {
	const exs = Array.isArray(session?.exercises) ? session.exercises : [];

	return {
		...session,
		exercises: exs.map((ex, idx) => {
			const key = normalizeExerciseKey(ex.name);
			const defaultWeight =
				defaults?.[key]?.defaultWeight != null
					? String(defaults[key].defaultWeight)
					: '';

			const sets = Array.isArray(ex.sets) ? ex.sets : [];

			return {
				expanded: openFirst ? idx === 0 : !!ex.expanded,
				...ex,
				sets: sets.map((s) => ({
					saved: false,
					savedAt: null,
					...s,
					weight:
						!s?.saved && !String(s?.weight || '').trim() && defaultWeight
							? defaultWeight
							: s.weight
				}))
			};
		})
	};
}

/**
 * Route-aware loader:
 * mode=edit  => load exact sessionId, DO NOT change status
 * mode=resume=> prefer sessionId else find today's in_progress
 * mode=start => find today's in_progress else create new
 *
 * buildEmptySession is injected so this factory stays pure/reusable.
 */
export async function getSessionForRoute({
	mode = 'start',
	sessionId = null,
	template,
	dateKey,
	buildEmptySession
}) {
	const [sessions, defaults] = await Promise.all([
		loadAllSessions(),
		loadExerciseDefaults()
	]);

	// --- EDIT: load exact session by id; never force status to in_progress
	if (mode === 'edit') {
		if (!sessionId) throw new Error('Missing sessionId for edit.');
		const found = sessions.find((s) => s.id === sessionId);
		if (!found) throw new Error('Session not found.');

		const normalized = normalizeSessionForUI({
			session: found,
			defaults,
			openFirst: true
		});

		// Persist only normalization (no status changes)
		await upsertSession(normalized);

		return { session: normalized, defaults };
	}

	// --- RESUME: sessionId first (if provided)
	if (mode === 'resume' && sessionId) {
		const found = sessions.find((s) => s.id === sessionId);
		if (found) {
			const normalized = normalizeSessionForUI({
				session: found,
				defaults,
				openFirst: true
			});
			await upsertSession(normalized);
			return { session: normalized, defaults };
		}
	}

	// --- START/RESUME fallback: find today's in_progress for this template
	const existing = sessions.find(
		(s) =>
			s.templateId === template.id &&
			s.date === dateKey &&
			s.status === 'in_progress'
	);

	if (existing) {
		const normalized = normalizeSessionForUI({
			session: existing,
			defaults,
			openFirst: true
		});
		await upsertSession(normalized);
		return { session: normalized, defaults };
	}

	// --- Create new session (start flow)
	const created = buildEmptySession({ template, defaultsMap: defaults });
	if (created?.exercises?.[0]) created.exercises[0].expanded = true;

	await upsertSession(created);
	return { session: created, defaults };
}
