// hooks/useProfile.js
import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { reduceCarbs as reduceCarbsRepo } from '@/controllers/profileController';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';

export function useProfile() {
	const [profile, setProfile] = useState({
		protein: 0,
		carbs: 0,
		fats: 0,
		profilePhotoUri: null,
		goal: null
	});
	const [progressPhotos, setProgressPhotos] = useState([]);

	useEffect(() => {
		let unsubProfile = null;
		let unsubPhotos = null;

		try {
			const user = getCurrentUser();
			if (!user) {
				console.warn('useProfile: No authenticated user');
				return;
			}

			const uid = user.uid;
			const profileRef = doc(db, 'users', uid);

			// Subscribe to profile data
			unsubProfile = onSnapshot(
				profileRef,
				(snap) => {
					const data = snap.exists() ? snap.data() || {} : {};
					setProfile({
						protein: Number(data.protein) || 0,
						carbs: Number(data.carbs) || 0,
						fats: Number(data.fats) || 0,
						profilePhotoUri: data.profilePhotoUri || null,
						goal: data.goal || null
					});
				},
				(err) => console.warn('profile subscription error:', err)
			);

			// Subscribe to progress photos
			const photosRef = collection(db, 'users', uid, 'progressPhotos');
			const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));

			unsubPhotos = onSnapshot(
				photosQuery,
				(snapshot) => {
					const photos = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
						createdAt:
							doc.data().createdAt?.toDate?.()?.toISOString() ||
							new Date().toISOString()
					}));
					setProgressPhotos(photos);
				},
				(err) => console.warn('progress photos subscription error:', err)
			);
		} catch (e) {
			console.warn('useProfile init error:', e);
		}

		return () => {
			if (unsubProfile) unsubProfile();
			if (unsubPhotos) unsubPhotos();
		};
	}, []);

	const calories = useMemo(() => {
		const p = Number(profile.protein) || 0;
		const c = Number(profile.carbs) || 0;
		const f = Number(profile.fats) || 0;
		return p * 4 + c * 4 + f * 9;
	}, [profile]);

	const reduceCarbs = useCallback(async (grams) => {
		const user = getCurrentUser();
		if (!user) {
			console.warn('reduceCarbs: No authenticated user');
			return;
		}
		await reduceCarbsRepo(user.uid, grams);
	}, []);

	return { profile, calories, progressPhotos, reduceCarbs };
}
