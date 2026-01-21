import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Ensures a user is signed in (creates anonymous user if needed)
 */
export async function ensureSignedIn() {
	return new Promise((resolve, reject) => {
		const unsubscribe = onAuthStateChanged(
			auth,
			async (user) => {
				unsubscribe();

				if (user) {
					// User already signed in
					resolve(user);
				} else {
					// No user, sign in anonymously
					try {
						const result = await signInAnonymously(auth);
						resolve(result.user);
					} catch (error) {
						reject(error);
					}
				}
			},
			(error) => {
				unsubscribe();
				reject(error);
			}
		);
	});
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with the current user whenever auth state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAuth(callback) {
	return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
	return auth.currentUser;
}

/**
 * Sign out the current user
 */
export async function signOut() {
	return auth.signOut();
}
