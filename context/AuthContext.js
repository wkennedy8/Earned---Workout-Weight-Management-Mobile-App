import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ensureSignedIn, subscribeToAuth } from '../lib/auth';

const AuthContext = createContext({
	user: null,
	loading: true,
	error: null
});

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let unsubscribe = null;

		(async () => {
			try {
				// Ensure we have a user ASAP (anonymous sign-in)
				await ensureSignedIn();

				// Subscribe to auth state changes
				unsubscribe = subscribeToAuth((firebaseUser) => {
					if (firebaseUser) {
						setUser({
							uid: firebaseUser.uid,
							email: firebaseUser.email,
							displayName: firebaseUser.displayName,
							photoURL: firebaseUser.photoURL,
							emailVerified: firebaseUser.emailVerified,
							isAnonymous: firebaseUser.isAnonymous
						});
					} else {
						setUser(null);
					}
					setLoading(false);
					setError(null);
				});
			} catch (e) {
				console.warn('AuthProvider error:', e);
				setError(e);
				setLoading(false);
			}
		})();

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, []);

	const value = {
		user,
		loading,
		error
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

// AuthGate component to wrap your app and ensure auth is ready
export function AuthGate({ children }) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let unsub = null;

		(async () => {
			try {
				// Ensure we have a user ASAP (anonymous for now)
				await ensureSignedIn();

				// Then subscribe so app reacts to auth changes
				unsub = subscribeToAuth(() => {
					setReady(true);
				});
			} catch (e) {
				console.warn('AuthGate error:', e);
				setReady(true); // allow app to render; hooks may show errors
			}
		})();

		return () => {
			if (unsub) unsub();
		};
	}, []);

	if (!ready) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator size='large' color='#1E66F5' />
				<Text
					style={{
						marginTop: 10,
						fontSize: 14,
						fontWeight: '700',
						color: '#6B7280'
					}}
				>
					Signing you in…
				</Text>
			</View>
		);
	}

	return children;
}
