// components/WeeklyStreakCard.jsx
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../constants/fonts';

/**
 * Get the current week (Mon-Sun) with dates
 * Returns array of 7 objects with date info
 */
function getCurrentWeek() {
	const now = new Date();
	const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

	// Calculate days to subtract to get to Monday
	const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

	const week = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(now);
		date.setDate(date.getDate() - daysToMonday + i);

		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		week.push({
			dayName: dayNames[date.getDay()],
			date: date.getDate(),
			fullDate: date,
			dateKey: formatDateKey(date),
			isToday: isSameDay(date, now)
		});
	}

	return week;
}

function formatDateKey(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export default function WeeklyStreakCard() {
	const { user } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [weekData, setWeekData] = useState([]);
	const [sessions, setSessions] = useState({});
	const [restDays, setRestDays] = useState({});

	useEffect(() => {
		if (!user?.uid) return;

		loadWeekData();
	}, [user?.uid]);

	async function loadWeekData() {
		try {
			setLoading(true);
			const week = getCurrentWeek();
			setWeekData(week);

			// Get all sessions for the current week
			const sessionsRef = collection(db, 'users', user.uid, 'sessions');
			const dateKeys = week.map((d) => d.dateKey);

			const q = query(sessionsRef, where('date', 'in', dateKeys));
			const snapshot = await getDocs(q);

			const sessionsMap = {};
			snapshot.docs.forEach((doc) => {
				const data = doc.data();
				sessionsMap[data.date] = {
					id: doc.id,
					...data
				};
			});

			setSessions(sessionsMap);

			// Get rest days (scheduleOverrides)
			const overridesRef = collection(
				db,
				'users',
				user.uid,
				'scheduleOverrides'
			);
			const overridesQuery = query(
				overridesRef,
				where('date', 'in', dateKeys),
				where('isRestDay', '==', true)
			);
			const overridesSnapshot = await getDocs(overridesQuery);

			const restDaysMap = {};
			overridesSnapshot.docs.forEach((doc) => {
				const data = doc.data();
				restDaysMap[data.date] = true;
			});
			setRestDays(restDaysMap);
		} catch (error) {
			console.error('Failed to load week data:', error);
		} finally {
			setLoading(false);
		}
	}

	function handleDayPress(day) {
		const session = sessions[day.dateKey];
		const isRestDay = restDays[day.dateKey];

		if (!session && !isRestDay) {
			// No workout completed and not a rest day
			return;
		}

		if (session && session.id) {
			// Navigate to workout details
			router.push(`/workout/details?sessionId=${session.id}`);
		}
	}

	function getDayStatus(day) {
		const session = sessions[day.dateKey];
		const isRestDay = restDays[day.dateKey];

		// Check if workout is completed (regardless of today/not today)
		if (session && session.status === 'completed') {
			return isRestDay ? 'rest' : 'completed';
		}

		// If it's a rest day (no completed session)
		if (isRestDay) {
			return 'rest';
		}

		// If it's today and no completed workout yet
		if (day.isToday) {
			return 'today';
		}

		// Future day or no data
		return 'none';
	}

	if (loading) {
		return (
			<View style={styles.card}>
				<ActivityIndicator color='#AFFF2B' />
			</View>
		);
	}

	return (
		<View style={styles.card}>
			<View style={styles.weekRow}>
				{weekData.map((day) => {
					const status = getDayStatus(day);
					const canPress = status === 'completed' || status === 'rest';

					return (
						<TouchableOpacity
							key={day.dateKey}
							style={styles.dayColumn}
							onPress={() => handleDayPress(day)}
							disabled={!canPress}
							activeOpacity={canPress ? 0.7 : 1}
						>
							{/* Day Name */}
							<Text
								style={[styles.dayName, day.isToday && styles.dayNameToday]}
							>
								{day.dayName}
							</Text>

							{/* Circle Indicator */}
							<View style={styles.circleContainer}>
								{status === 'completed' && (
									<View style={[styles.circle, styles.circleCompleted]}>
										<Text style={styles.dateNumberCompleted}>{day.date}</Text>
									</View>
								)}

								{status === 'rest' && (
									<View style={[styles.circle, styles.circleRest]}>
										<Text style={styles.dateNumberRest}>{day.date}</Text>
									</View>
								)}

								{status === 'today' && (
									<View style={[styles.circle, styles.circleToday]}>
										<Text style={styles.dateNumber}>{day.date}</Text>
									</View>
								)}

								{status === 'none' && (
									<Text style={styles.dateNumberOnly}>{day.date}</Text>
								)}
							</View>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	weekRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	dayColumn: {
		alignItems: 'center',
		flex: 1
	},
	dayName: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginBottom: 8
	},
	dayNameToday: {
		color: '#FFFFFF'
	},
	circleContainer: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	circle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3
	},
	circleCompleted: {
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		borderColor: '#AFFF2B'
	},
	circleRest: {
		backgroundColor: 'rgba(100, 149, 237, 0.15)',
		borderColor: '#6495ED' // Cornflower blue for rest days
	},
	circleToday: {
		backgroundColor: '#2A2A2A',
		borderColor: '#666666'
	},
	dateNumber: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	dateNumberCompleted: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	dateNumberRest: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#6495ED'
	},
	dateNumberOnly: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#666666'
	}
});
