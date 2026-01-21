// hooks/useWeightEntries.js
import {
	collection,
	limit,
	onSnapshot,
	orderBy,
	query
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { upsertWeight } from '@/controllers/weightController';
import { db } from '@/lib/firebase';

/**
 * Format current date as YYYY-MM-DD
 */
function formatLocalDateKey(date = new Date()) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/**
 * Hook to manage weight entries with real-time Firestore sync
 * @param {number} take - Maximum number of entries to fetch (default: 365)
 */
export function useWeightEntries({ take = 365 } = {}) {
	const { user } = useAuth();
	const [entries, setEntries] = useState([]);
	const todayKey = useMemo(() => formatLocalDateKey(new Date()), []);

	// Real-time subscription to weight entries
	useEffect(() => {
		if (!user?.uid) {
			setEntries([]);
			return;
		}

		const weightsRef = collection(db, 'users', user.uid, 'weights');
		const q = query(weightsRef, orderBy('date', 'desc'), limit(take));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const weights = snapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						date: data.date || doc.id,
						weight: Number(data.weight)
					};
				});
				setEntries(weights);
			},
			(error) => {
				console.warn('Weight entries subscription error:', error);
				setEntries([]);
			}
		);

		return () => unsubscribe();
	}, [user?.uid, take]);

	/**
	 * Get weight entry for a specific date
	 */
	const getEntryForDate = useCallback(
		(dateKey) => entries.find((e) => e.date === dateKey) || null,
		[entries]
	);

	/**
	 * Upsert (create or update) a weight entry
	 * Returns optimistically updated entries array for immediate UI feedback
	 */
	const upsertEntry = useCallback(
		async ({ dateKey, weight }) => {
			if (!user?.uid) {
				throw new Error('User not authenticated');
			}

			await upsertWeight(user.uid, { dateKey, weight });

			// Optimistic update: return immediately updated array
			// (Firestore snapshot will sync shortly after)
			const updatedEntries = [...entries];
			const existingIndex = updatedEntries.findIndex((e) => e.date === dateKey);

			if (existingIndex >= 0) {
				updatedEntries[existingIndex] = {
					date: dateKey,
					weight: Number(weight)
				};
			} else {
				updatedEntries.unshift({ date: dateKey, weight: Number(weight) });
			}

			// Maintain descending date order
			updatedEntries.sort((a, b) => b.date.localeCompare(a.date));

			return updatedEntries;
		},
		[user?.uid, entries]
	);

	return {
		entries,
		todayKey,
		getEntryForDate,
		upsertEntry
	};
}
