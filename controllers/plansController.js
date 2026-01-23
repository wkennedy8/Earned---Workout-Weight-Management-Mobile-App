import { db } from '@/lib/firebase';
import { PLAN } from '@/utils/workoutPlan';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Get user's selected plan (or default)
export async function getUserWorkoutPlan(uid) {
	try {
		const ref = doc(db, 'users', uid, 'settings', 'workoutPlan');
		const snap = await getDoc(ref);

		if (snap.exists()) {
			const data = snap.data();
			// Return custom plan or selected default plan
			return data.customPlan || PLAN[data.selectedPlanId] || PLAN.ppl;
		}

		// Default to PPL plan
		return PLAN.ppl;
	} catch (e) {
		console.warn('Failed to load workout plan:', e);
		return PLAN.ppl;
	}
}

// Save user's plan selection
export async function setUserWorkoutPlan(
	uid,
	{ selectedPlanId, customPlan = null }
) {
	const ref = doc(db, 'users', uid, 'settings', 'workoutPlan');
	await setDoc(
		ref,
		{
			selectedPlanId,
			customPlan,
			updatedAt: new Date().toISOString()
		},
		{ merge: true }
	);
}

// Get all available default plans
export function getDefaultPlans() {
	return Object.values(PLAN);
}

// Create a custom plan (for future use)
export async function createCustomPlan(uid, planData) {
	const planId = `custom_${Date.now()}`;
	const customPlan = {
		id: planId,
		...planData,
		isCustom: true,
		createdAt: new Date().toISOString()
	};

	await setUserWorkoutPlan(uid, {
		selectedPlanId: planId,
		customPlan
	});

	return customPlan;
}
