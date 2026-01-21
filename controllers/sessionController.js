// controllers/sessionController.js

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
	updateDoc,
	where
} from 'firebase/firestore';
import { Alert, Share } from 'react-native';
import { db } from '../lib/firebase';
import { formatLocalDateKey } from '../utils/dateUtils';
import { defaultSetCount, normalizeExerciseKey } from '../utils/workoutUtils';

function sessionsCol(uid) {
	return collection(db, 'users', uid, 'sessions');
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
	const ref = doc(db, 'users', uid, 'sessions', sessionId);
	await updateDoc(ref, {
		status: 'completed',
		completedAt: new Date().toISOString(),
		updatedAt: serverTimestamp()
	});
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

export function buildEmptySession({ template, defaultsMap }) {
	const dateKey = formatLocalDateKey(new Date());

	return {
		id: `${dateKey}_${template.id}`,
		date: dateKey,
		templateId: template.id,
		title: template.title,
		tag: template.tag,
		status: 'in_progress',
		exercises: template.exercises.map((ex) => {
			const count = defaultSetCount(ex.sets);
			const exKey = normalizeExerciseKey(ex.name);

			// Get default weight from Firebase (progressive overload)
			const defaultWeight =
				defaultsMap?.[exKey]?.defaultWeight != null
					? String(defaultsMap[exKey].defaultWeight)
					: '';

			return {
				name: ex.name,
				targetSets: ex.sets,
				targetReps: ex.reps,
				note: ex.note || '',
				expanded: false,
				sets: Array.from({ length: count }).map((_, idx) => ({
					setIndex: idx + 1,
					weight: defaultWeight, // Pre-filled from previous workout!
					reps: '',
					saved: false,
					savedAt: null
				}))
			};
		})
	};
}
