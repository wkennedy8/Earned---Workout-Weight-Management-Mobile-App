// hooks/useProfile.js
import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { reduceCarbs as reduceCarbsRepo } from '@/controllers/profileController';
import { getUidOrThrow } from '@/lib/auth';
import { db } from '@/lib/firebase';

export function useProfile() {
	const [profile, setProfile] = useState({
		protein: 0,
		carbs: 0,
		fats: 0,
		profilePhotoUri: null
	});

	useEffect(() => {
		let unsub = null;

		try {
			const uid = getUidOrThrow();
			const ref = doc(db, 'users', uid);

			unsub = onSnapshot(
				ref,
				(snap) => {
					const data = snap.exists() ? snap.data() || {} : {};
					setProfile({
						protein: Number(data.protein) || 0,
						carbs: Number(data.carbs) || 0,
						fats: Number(data.fats) || 0,
						profilePhotoUri: data.profilePhotoUri || null
					});
				},
				(err) => console.warn('profile subscription error:', err)
			);
		} catch (e) {
			console.warn('useProfile init error:', e);
		}

		return () => {
			if (unsub) unsub();
		};
	}, []);

	const calories = useMemo(() => {
		const p = Number(profile.protein) || 0;
		const c = Number(profile.carbs) || 0;
		const f = Number(profile.fats) || 0;
		return p * 4 + c * 4 + f * 9;
	}, [profile]);

	const reduceCarbs = useCallback(async (grams) => {
		const uid = getUidOrThrow();
		await reduceCarbsRepo(uid, grams);
	}, []);

	return { profile, calories, reduceCarbs };
}
