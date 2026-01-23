import {
	PhoneAuthProvider,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	signInAnonymously,
	signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const ADMIN_UID = 'NzTikEHD5cYjxmYcMgeT5i2tYA83';

export async function isAdmin(uid) {
	try {
		// Quick check for known admin UID
		if (uid === ADMIN_UID) return true;

		const userDoc = await getDoc(doc(db, 'users', uid));
		return userDoc.exists() && userDoc.data()?.isAdmin === true;
	} catch (e) {
		console.warn('Error checking admin status:', e);
		return false;
	}
}

/**
 * Ensures a user is signed in (creates anonymous user if needed)
 * NOTE: This is now primarily for admin/testing. New users should use phone auth.
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
 * Send phone verification code
 * @param {string} phoneNumber - Phone number with country code (e.g., +1234567890)
 * @param {Object} recaptchaVerifier - Firebase reCAPTCHA verifier
 * @returns {Promise} Confirmation result for code verification
 */
export async function sendPhoneVerification(phoneNumber, recaptchaVerifier) {
	try {
		const confirmationResult = await signInWithPhoneNumber(
			auth,
			phoneNumber,
			recaptchaVerifier
		);
		return confirmationResult;
	} catch (error) {
		console.error('Error sending verification code:', error);
		throw error;
	}
}

/**
 * Verify phone code and sign in
 * @param {Object} confirmationResult - Result from sendPhoneVerification
 * @param {string} code - 6-digit verification code
 * @returns {Promise<User>} Firebase user
 */
export async function verifyPhoneCode(confirmationResult, code) {
	try {
		const result = await confirmationResult.confirm(code);
		return result.user;
	} catch (error) {
		console.error('Error verifying code:', error);
		throw error;
	}
}

/**
 * Link phone number to existing anonymous account
 * @param {Object} confirmationResult - Result from sendPhoneVerification
 * @param {string} code - 6-digit verification code
 */
export async function linkPhoneToAccount(confirmationResult, code) {
	try {
		const credential = PhoneAuthProvider.credential(
			confirmationResult.verificationId,
			code
		);
		const result = await auth.currentUser.linkWithCredential(credential);
		return result.user;
	} catch (error) {
		console.error('Error linking phone to account:', error);
		throw error;
	}
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
	return firebaseSignOut(auth);
}
