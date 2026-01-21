import { db } from '@/lib/firebase';
import {
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
	updateDoc
} from 'firebase/firestore';

function profileRef(uid) {
	return doc(db, 'users', uid);
}

export async function getProfile(uid) {
	const snap = await getDoc(profileRef(uid));
	if (!snap.exists()) {
		return {
			protein: 0,
			carbs: 0,
			fats: 0,
			profilePhotoUri: null
		};
	}
	const data = snap.data() || {};
	return {
		protein: Number(data.protein) || 0,
		carbs: Number(data.carbs) || 0,
		fats: Number(data.fats) || 0,
		profilePhotoUri: data.profilePhotoUri || null
	};
}

export async function upsertProfile(uid, patch) {
	await setDoc(
		profileRef(uid),
		{
			...patch,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}

export async function reduceCarbs(uid, grams) {
	const snap = await getDoc(profileRef(uid));
	const data = snap.exists() ? snap.data() || {} : {};
	const currentCarbs = Number(data.carbs) || 0;
	const nextCarbs = Math.max(0, currentCarbs - Number(grams || 0));

	if (!snap.exists()) {
		// create doc if missing
		await setDoc(
			profileRef(uid),
			{ protein: 0, carbs: nextCarbs, fats: 0, updatedAt: serverTimestamp() },
			{ merge: true }
		);
		return nextCarbs;
	}

	await updateDoc(profileRef(uid), {
		carbs: nextCarbs,
		updatedAt: serverTimestamp()
	});
	return nextCarbs;
}
