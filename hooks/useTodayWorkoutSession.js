// hooks/useTodayWorkoutSession.js

import { useAuth } from '@/context/AuthContext';
import {
	getCompletedSessionForDay,
	getInProgressSessionForDay
} from '@/controllers/sessionController';
import { useCallback, useState } from 'react';

export function useTodayWorkoutSession({ templateId, dateKey }) {
	const { user } = useAuth();
	const [completedSession, setCompletedSession] = useState(null);
	const [inProgressSession, setInProgressSession] = useState(null);

	const refresh = useCallback(async () => {
		if (!templateId || !dateKey || !user?.uid) {
			setCompletedSession(null);
			setInProgressSession(null);
			return;
		}

		try {
			// Use your existing controller functions
			const [inProgress, completed] = await Promise.all([
				getInProgressSessionForDay(user.uid, { templateId, dateKey }),
				getCompletedSessionForDay(user.uid, { templateId, dateKey })
			]);

			setInProgressSession(inProgress);
			setCompletedSession(completed);
		} catch (e) {
			console.warn('Failed to refresh sessions:', e);
			setCompletedSession(null);
			setInProgressSession(null);
		}
	}, [user?.uid, templateId, dateKey]);

	return {
		completedSession,
		inProgressSession,
		refresh
	};
}
