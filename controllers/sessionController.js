import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	where
} from 'firebase/firestore';
import { Alert, Share } from 'react-native';
import { db } from '../lib/firebase';
import { formatLocalDateKey } from '../utils/dateUtils';
import { PLAN } from '../utils/workoutPlan';
import { normalizeExerciseKey } from '../utils/workoutUtils';
import { checkAndAdvanceWeek } from './weekCompletionController';

function sessionsCol(uid) {
	return collection(db, 'users', uid, 'sessions');
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getSessionById(uid, sessionId) {
	const ref = doc(db, 'users', uid, 'sessions', sessionId);
	const snap = await getDoc(ref);
	return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function upsertSession(uid, session) {
	if (!session?.id) throw new Error('Session missing id');

	const ref = doc(db, 'users', uid, 'sessions', session.id);
	await setDoc(
		ref,
		{
			...session,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}

export async function markSessionCompleted(uid, sessionId) {
	try {
		const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);

		// Get the session before updating it
		const sessionSnap = await getDoc(sessionRef);
		if (!sessionSnap.exists()) {
			throw new Error('Session not found');
		}

		const session = { id: sessionSnap.id, ...sessionSnap.data() };

		// Mark as completed
		await setDoc(
			sessionRef,
			{
				status: 'completed',
				completedAt: new Date().toISOString()
			},
			{ merge: true }
		);

		// CHECK FOR WEEK COMPLETION - NEW CODE
		if (session.programWeek) {
			// Get user's plan
			const plan = await getUserWorkoutPlan(uid);
			const planId = plan?.id || 'ppl';

			// Check if week should advance
			const result = await checkAndAdvanceWeek(uid, planId, session);

			// Return result so UI can show congratulations message
			return {
				success: true,
				weekAdvancement: result
			};
		}

		return { success: true };
	} catch (error) {
		console.error('Error marking session completed:', error);
		throw error;
	}
}

export async function getInProgressSessionForDay(uid, { templateId, dateKey }) {
	const q = query(
		sessionsCol(uid),
		where('templateId', '==', templateId),
		where('date', '==', dateKey),
		where('status', '==', 'in_progress'),
		limit(1)
	);
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() };
}

export async function getCompletedSessionForDay(uid, { templateId, dateKey }) {
	const q = query(
		sessionsCol(uid),
		where('templateId', '==', templateId),
		where('date', '==', dateKey),
		where('status', '==', 'completed'),
		orderBy('completedAt', 'desc'),
		limit(1)
	);
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() };
}

export function computeSessionStats(session) {
	if (!session?.exercises) {
		return {
			exercisesCompleted: 0,
			exercisesPlanned: 0,
			totalSets: 0,
			totalReps: 0,
			totalVolume: 0,
			bestSet: null,
			durationSeconds: null
		};
	}

	let totalSets = 0;
	let totalReps = 0;
	let totalVolume = 0;
	let bestSet = null;
	let bestSetValue = 0;
	let exercisesCompleted = 0;

	session.exercises.forEach((exercise) => {
		const savedSets = exercise.sets?.filter((s) => s.saved) || [];

		if (savedSets.length > 0) {
			exercisesCompleted++;
		}

		savedSets.forEach((set) => {
			totalSets++;

			const reps = Number(set.reps) || 0;
			const weight = Number(set.weight) || 0;

			totalReps += reps;
			totalVolume += weight * reps;

			// Track best set (highest weight × reps)
			const setValue = weight * reps;
			if (setValue > bestSetValue) {
				bestSetValue = setValue;
				bestSet = {
					exerciseName: exercise.name,
					weight,
					reps
				};
			}
		});
	});

	return {
		exercisesCompleted,
		exercisesPlanned: session.exercises.length,
		totalSets,
		totalReps,
		totalVolume,
		bestSet,
		durationSeconds: null
	};
}

export function formatSessionForShare(session) {
	if (!session) return 'Workout completed!';

	const stats = computeSessionStats(session);

	let message = `💪 ${session.title || 'Workout'} - Completed\n\n`;

	message += `📊 Stats:\n`;
	message += `• Exercises: ${stats.exercisesCompleted}/${stats.exercisesPlanned}\n`;
	message += `• Sets: ${stats.totalSets}\n`;
	message += `• Reps: ${stats.totalReps}\n`;
	message += `• Volume: ${Math.round(stats.totalVolume).toLocaleString()} lbs\n`;

	if (stats.bestSet) {
		message += `\n🏆 Best Set:\n`;
		message += `${stats.bestSet.exerciseName}: ${stats.bestSet.weight} lbs × ${stats.bestSet.reps} reps\n`;
	}

	message += `\n📅 ${new Date().toLocaleDateString()}`;

	return message;
}

export async function shareCompletedSession(completedSession) {
	const message = formatSessionForShare(completedSession);

	try {
		await Share.share({
			message,
			title: completedSession?.title || 'Workout Summary'
		});
	} catch (e) {
		console.warn('Share failed:', e);
		Alert.alert('Error', 'Could not open share sheet.');
	}
}

export function buildEmptySession({ template, defaultsMap = {} }) {
	// Handle both old template object or new nested structure
	let workoutTemplate = template;

	// If template is just an ID string, look it up
	if (typeof template === 'string') {
		// Try to find in nested structure
		for (const plan of Object.values(PLAN)) {
			if (plan.workouts && plan.workouts[template]) {
				workoutTemplate = plan.workouts[template];
				break;
			}
		}
	}

	if (!workoutTemplate || !workoutTemplate.id) {
		throw new Error('Invalid workout template');
	}

	const exercises = (workoutTemplate.exercises || []).map((ex) => {
		const exKey = normalizeExerciseKey(ex.name);
		const defaultWeight =
			defaultsMap?.[exKey]?.defaultWeight != null
				? String(defaultsMap[exKey].defaultWeight)
				: '';

		const numSets = ex.sets?.includes('-')
			? parseInt(ex.sets.split('-')[0], 10)
			: parseInt(ex.sets, 10);

		const sets = Array.from({ length: numSets }, (_, i) => ({
			setIndex: i + 1,
			weight: defaultWeight,
			reps: '',
			saved: false,
			savedAt: null
		}));

		return {
			name: ex.name,
			targetSets: ex.sets,
			targetReps: ex.reps,
			note: ex.note || '',
			sets,
			expanded: false
		};
	});

	return {
		id: generateSessionId(),
		templateId: workoutTemplate.id,
		title: workoutTemplate.title || 'Workout',
		tag: workoutTemplate.tag || 'Workout',
		date: formatLocalDateKey(new Date()),
		status: 'in_progress',
		startedAt: new Date().toISOString(),
		completedAt: null,
		exercises
	};
}
