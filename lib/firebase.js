import { getApp, getApps, initializeApp } from 'firebase/app';

import {
	getAuth,
	getReactNativePersistence,
	initializeAuth
} from 'firebase/auth';

import {
	enableIndexedDbPersistence,
	getFirestore,
	initializeFirestore
} from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
	apiKey: 'AIzaSyCA1rbCtVjfMiNT5n6Vej8CwhShWu2CFD4',
	authDomain: 'earned-59f4f.firebaseapp.com',
	projectId: 'earned-59f4f',
	storageBucket: 'earned-59f4f.firebasestorage.app',
	messagingSenderId: '379690674214',
	appId: '1:379690674214:web:7fc48ae109298515959ee7',
	measurementId: 'G-GZYS0KJ9S8'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Auth
 * For React Native, you need initializeAuth + AsyncStorage persistence.
 * Using getAuth() can work in some environments, but initializeAuth is the correct RN path.
 */
let auth;
try {
	auth = initializeAuth(app, {
		persistence: getReactNativePersistence(AsyncStorage)
	});
} catch (e) {
	// If initializeAuth was called already (fast refresh), fall back to getAuth
	auth = getAuth(app);
}

/**
 * Firestore
 * Offline persistence:
 * - On native, Firestore uses an internal persistence layer.
 * - enableIndexedDbPersistence is for web; it may throw on native. So we guard it.
 */
let db;
try {
	db = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch (e) {
	db = getFirestore(app);
}

// Best-effort persistence enablement (safe to ignore errors)
(async () => {
	try {
		await enableIndexedDbPersistence(db);
	} catch (e) {
		// On React Native this usually throws; ignore.
	}
})();

export { app, auth, db };
