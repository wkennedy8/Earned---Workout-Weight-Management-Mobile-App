import { db } from '@/lib/firebase';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	setDoc,
	where
} from 'firebase/firestore';

// Cardio types
export const CARDIO_TYPES = [
	{ id: 'treadmill', label: 'Treadmill', icon: 'walk' },
	{ id: 'running', label: 'Running', icon: 'fitness' },
	{ id: 'walking', label: 'Walking', icon: 'walk-outline' },
	{ id: 'cycling', label: 'Cycling', icon: 'bicycle' },
	{ id: 'swimming', label: 'Swimming', icon: 'water' },
	{ id: 'stairmaster', label: 'Stairmaster', icon: 'trending-up' },
	{ id: 'other', label: 'Other', icon: 'ellipsis-horizontal' }
];

/**
 * Log a cardio session
 */
export async function logCardioSession(uid, data) {
	try {
		const {
			date,
			type,
			duration,
			distance,
			speed,
			incline,
			level,
			pace,
			notes = ''
		} = data;
		const cardioRef = doc(db, 'users', uid, 'cardio', date);

		const sessionData = {
			date,
			type,
			duration: Number(duration) || 0,
			completedAt: new Date().toISOString()
		};

		// Add optional fields if present
		if (distance !== null && distance !== undefined) {
			sessionData.distance = Number(distance);
		}
		if (speed !== null && speed !== undefined) {
			sessionData.speed = Number(speed);
		}
		if (incline !== null && incline !== undefined) {
			sessionData.incline = Number(incline);
		}
		if (level !== null && level !== undefined) {
			sessionData.level = Number(level);
		}
		if (pace !== null && pace !== undefined) {
			sessionData.pace = Number(pace);
		}
		if (notes) {
			sessionData.notes = notes;
		}

		await setDoc(cardioRef, sessionData);

		return true;
	} catch (error) {
		console.error('Error logging cardio:', error);
		throw error;
	}
}

/**
 * Get cardio session for a specific date
 */
export async function getCardioForDate(uid, date) {
	try {
		const cardioRef = doc(db, 'users', uid, 'cardio', date);
		const snap = await getDoc(cardioRef);

		if (!snap.exists()) return null;

		return {
			id: snap.id,
			...snap.data()
		};
	} catch (error) {
		console.error('Error getting cardio for date:', error);
		return null;
	}
}

/**
 * Get recent cardio sessions
 */
export async function getRecentCardio(uid, days = 30) {
	try {
		const cardioRef = collection(db, 'users', uid, 'cardio');
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);
		const cutoffDateKey = cutoffDate.toISOString().split('T')[0];

		const q = query(
			cardioRef,
			where('date', '>=', cutoffDateKey),
			orderBy('date', 'desc')
		);

		const snap = await getDocs(q);
		return snap.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));
	} catch (error) {
		console.error('Error getting recent cardio:', error);
		return [];
	}
}

/**
 * Get all cardio sessions (for analytics)
 */
export async function getAllCardio(uid) {
	try {
		const cardioRef = collection(db, 'users', uid, 'cardio');
		const q = query(cardioRef, orderBy('date', 'desc'));
		const snap = await getDocs(q);

		return snap.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));
	} catch (error) {
		console.error('Error getting all cardio:', error);
		return [];
	}
}

/**
 * Delete a cardio session
 */
export async function deleteCardioSession(uid, date) {
	try {
		const cardioRef = doc(db, 'users', uid, 'cardio', date);
		await deleteDoc(cardioRef);
		return true;
	} catch (error) {
		console.error('Error deleting cardio:', error);
		throw error;
	}
}
