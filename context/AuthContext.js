import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { isAdmin, subscribeToAuth } from '../lib/auth';

const AuthContext = createContext({
	user: null,
	loading: true,
	error: null,
	isAdmin: false
});

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userIsAdmin, setUserIsAdmin] = useState(false);

	const router = useRouter();
	const segments = useSegments();

	// Subscribe to auth state changes
	useEffect(() => {
		const unsubscribe = subscribeToAuth(async (firebaseUser) => {
			console.log('Auth state changed:', firebaseUser?.uid);

			if (firebaseUser) {
				// Check if user is admin
				const adminStatus = await isAdmin(firebaseUser.uid);

				setUser({
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					phoneNumber: firebaseUser.phoneNumber,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL,
					emailVerified: firebaseUser.emailVerified,
					isAnonymous: firebaseUser.isAnonymous
				});
				setUserIsAdmin(adminStatus);
			} else {
				setUser(null);
				setUserIsAdmin(false);
			}

			setLoading(false);
			setError(null);
		});

		return () => unsubscribe();
	}, []);

	// Handle navigation based on auth state
	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === 'login';

		console.log('Navigation check:', { user: !!user, inAuthGroup, segments });

		if (!user && !inAuthGroup) {
			// No user, redirect to login
			console.log('Redirecting to login');
			router.replace('/login');
		} else if (user && inAuthGroup) {
			// User exists, redirect to app
			console.log('Redirecting to app');
			router.replace('/(tabs)');
		}
	}, [user, loading, segments]);

	const value = {
		user,
		loading,
		error,
		isAdmin: userIsAdmin
	};

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#000000'
				}}
			>
				<ActivityIndicator size='large' color='#AFFF2B' />
				<Text
					style={{
						marginTop: 10,
						fontSize: 14,
						fontWeight: '700',
						color: '#999999'
					}}
				>
					Loading...
				</Text>
			</View>
		);
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

// Remove AuthGate - we're handling navigation in AuthProvider now
