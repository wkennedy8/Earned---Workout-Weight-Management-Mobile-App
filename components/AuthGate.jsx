// components/AuthGate.jsx
import { ensureSignedIn, subscribeToAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthGate({ children }) {
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
				<ActivityIndicator />
				<Text style={{ marginTop: 10 }}>Signing you in…</Text>
			</View>
		);
	}

	return children;
}
