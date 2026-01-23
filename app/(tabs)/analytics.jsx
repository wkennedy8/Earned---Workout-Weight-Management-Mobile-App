import { useAuth } from '@/context/AuthContext';
import { CARDIO_TYPES, getAllCardio } from '@/controllers/cardioController';
import { computeSessionStats } from '@/controllers/sessionController';
import { getRecentWeights } from '@/controllers/weightController';
import { db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

const screenWidth = Dimensions.get('window').width;

// Helper to calculate streak
function calculateStreak(sessions) {
	if (!sessions.length) return 0;

	// Sort by date descending (most recent first)
	const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

	// Get unique dates (in case multiple sessions on same day)
	const uniqueDates = [...new Set(sorted.map((s) => s.date))];

	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < uniqueDates.length; i++) {
		const sessionDate = new Date(uniqueDates[i]);
		sessionDate.setHours(0, 0, 0, 0);

		const diffTime = today - sessionDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		// Check if this session is part of the consecutive streak
		// First session should be today (0) or yesterday (1)
		// Each subsequent session should be exactly 1 day before the previous
		if (i === 0) {
			// First session must be today or yesterday
			if (diffDays === 0 || diffDays === 1) {
				streak++;
			} else {
				// No recent activity, streak is 0
				break;
			}
		} else {
			// Check if this date is exactly 1 day before the previous date
			const prevDate = new Date(uniqueDates[i - 1]);
			prevDate.setHours(0, 0, 0, 0);

			const daysBetween = Math.floor(
				(prevDate - sessionDate) / (1000 * 60 * 60 * 24)
			);

			if (daysBetween === 1) {
				streak++;
			} else {
				// Gap in streak
				break;
			}
		}
	}
	return streak;
}

// Helper to calculate cardio streak
function calculateCardioStreak(sessions) {
	if (!sessions.length) return 0;

	// Sort by date descending (most recent first)
	const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

	// Get unique dates
	const uniqueDates = [...new Set(sorted.map((s) => s.date))];

	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < uniqueDates.length; i++) {
		const sessionDate = new Date(uniqueDates[i]);
		sessionDate.setHours(0, 0, 0, 0);

		const diffTime = today - sessionDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (i === 0) {
			// First session must be today or within the last 7 days for cardio
			if (diffDays <= 7) {
				streak++;
			} else {
				break;
			}
		} else {
			// Check if this date is within 7 days of the previous date
			const prevDate = new Date(uniqueDates[i - 1]);
			prevDate.setHours(0, 0, 0, 0);

			const daysBetween = Math.floor(
				(prevDate - sessionDate) / (1000 * 60 * 60 * 24)
			);

			if (daysBetween <= 7) {
				streak++;
			} else {
				break;
			}
		}
	}
	return streak;
}

export default function AnalyticsScreen() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);

	// Weight data
	const [weights, setWeights] = useState([]);
	const [weightRange, setWeightRange] = useState('7'); // '7', '30', '90'

	// Workout stats
	const [completedSessions, setCompletedSessions] = useState([]);
	const [totalVolume, setTotalVolume] = useState(0);
	const [totalSets, setTotalSets] = useState(0);
	const [totalReps, setTotalReps] = useState(0);
	const [streak, setStreak] = useState(0);

	// Personal records
	const [bestVolumeSession, setBestVolumeSession] = useState(null);
	const [bestSet, setBestSet] = useState(null);
	const [mostSetsSession, setMostSetsSession] = useState(null);

	//Cardio
	const [cardioSessions, setCardioSessions] = useState([]);
	const [totalCardioTime, setTotalCardioTime] = useState(0);
	const [totalCardioDistance, setTotalCardioDistance] = useState(0);
	const [cardioStreak, setCardioStreak] = useState(0);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				setLoading(true);

				// Load weights
				const weightData = await getRecentWeights(user.uid, { take: 365 });
				setWeights(weightData);

				// Load completed sessions
				const sessionsRef = collection(db, 'users', user.uid, 'sessions');
				const q = query(sessionsRef, where('status', '==', 'completed'));
				const snap = await getDocs(q);
				const sessions = snap.docs
					.map((d) => ({ id: d.id, ...d.data() }))
					.sort((a, b) => {
						// Sort by completedAt in descending order (newest first)
						const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
						const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
						return dateB - dateA;
					});

				setCompletedSessions(sessions);

				// Load cardio sessions
				const cardioData = await getAllCardio(user.uid);
				setCardioSessions(cardioData);

				// Calculate overall stats
				let volumeSum = 0;
				let setsSum = 0;
				let repsSum = 0;
				let bestVolume = 0;
				let bestVolumeSessionData = null;
				let globalBestSet = null;
				let globalBestSetValue = 0;
				let mostSets = 0;
				let mostSetsSessionData = null;

				sessions.forEach((session) => {
					const stats = computeSessionStats(session);

					volumeSum += stats.totalVolume;
					setsSum += stats.totalSets;
					repsSum += stats.totalReps;

					// Track best volume session
					if (stats.totalVolume > bestVolume) {
						bestVolume = stats.totalVolume;
						bestVolumeSessionData = {
							title: session.title,
							volume: stats.totalVolume,
							date: session.date
						};
					}

					// Track best set globally
					if (stats.bestSet) {
						const setValue = stats.bestSet.weight * stats.bestSet.reps;
						if (setValue > globalBestSetValue) {
							globalBestSetValue = setValue;
							globalBestSet = stats.bestSet;
						}
					}

					// Track most sets in a session
					if (stats.totalSets > mostSets) {
						mostSets = stats.totalSets;
						mostSetsSessionData = {
							title: session.title,
							sets: stats.totalSets,
							date: session.date
						};
					}
				});

				setTotalVolume(volumeSum);
				setTotalSets(setsSum);
				setTotalReps(repsSum);
				setBestVolumeSession(bestVolumeSessionData);
				setBestSet(globalBestSet);
				setMostSetsSession(mostSetsSessionData);

				// Calculate streak
				const currentStreak = calculateStreak(sessions);
				setStreak(currentStreak);

				// Calculate cardio stats
				let cardioTimeSum = 0;
				let cardioDistanceSum = 0;

				cardioData.forEach((session) => {
					cardioTimeSum += session.duration || 0;
					cardioDistanceSum += session.distance || 0;
				});

				setTotalCardioTime(cardioTimeSum);
				setTotalCardioDistance(cardioDistanceSum);

				// Calculate cardio streak
				const currentCardioStreak = calculateCardioStreak(cardioData);
				setCardioStreak(currentCardioStreak);
			} catch (e) {
				console.warn('Failed to load analytics:', e);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	// Filter weights by selected range
	const filteredWeights = weights.filter((w) => {
		const days = parseInt(weightRange);
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);
		const weightDate = new Date(w.date);
		return weightDate >= cutoff;
	});

	// Prepare chart data
	const chartData = {
		labels:
			filteredWeights.length > 0
				? filteredWeights
						.slice()
						.reverse()
						.map((w, index, array) => {
							// Show label every 5 days, or first and last
							if (
								index === 0 ||
								index === array.length - 1 ||
								index % 5 === 0
							) {
								const d = new Date(w.date);
								return `${d.getMonth() + 1}/${d.getDate()}`;
							}
							return ''; // Empty string for dates we don't want to show
						})
				: [''],
		datasets: [
			{
				data:
					filteredWeights.length > 0
						? filteredWeights
								.slice()
								.reverse()
								.map((w) => w.weight)
						: [0]
			}
		]
	};

	// Calculate weight change
	const weightChange =
		filteredWeights.length >= 2
			? filteredWeights[0].weight -
				filteredWeights[filteredWeights.length - 1].weight
			: 0;

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
					<Text style={styles.loadingText}>Loading analytics…</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Analytics</Text>
					<Text style={styles.subtitle}>
						Track your progress and achievements
					</Text>
				</View>

				{/* Weight Progress Chart */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<View>
							<Text style={styles.sectionTitle}>Weight Progress</Text>
							{filteredWeights.length >= 2 && (
								<Text
									style={[
										styles.changeText,
										weightChange > 0
											? styles.changePositive
											: weightChange < 0
												? styles.changeNegative
												: styles.changeNeutral
									]}
								>
									{weightChange > 0 ? '+' : ''}
									{weightChange.toFixed(1)} lbs
								</Text>
							)}
						</View>
					</View>

					{/* Time range selector */}
					<View style={styles.rangeSelector}>
						<TouchableOpacity
							style={[
								styles.rangeButton,
								weightRange === '7' && styles.rangeButtonActive
							]}
							onPress={() => setWeightRange('7')}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.rangeButtonText,
									weightRange === '7' && styles.rangeButtonTextActive
								]}
							>
								1W
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.rangeButton,
								weightRange === '30' && styles.rangeButtonActive
							]}
							onPress={() => setWeightRange('30')}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.rangeButtonText,
									weightRange === '30' && styles.rangeButtonTextActive
								]}
							>
								30D
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.rangeButton,
								weightRange === '90' && styles.rangeButtonActive
							]}
							onPress={() => setWeightRange('90')}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.rangeButtonText,
									weightRange === '90' && styles.rangeButtonTextActive
								]}
							>
								90D
							</Text>
						</TouchableOpacity>
					</View>

					{filteredWeights.length > 0 ? (
						<LineChart
							data={chartData}
							width={screenWidth - 64}
							height={220}
							chartConfig={{
								backgroundColor: '#1A1A1A',
								backgroundGradientFrom: '#1A1A1A',
								backgroundGradientTo: '#1A1A1A',
								decimalPlaces: 1,
								color: (opacity = 1) => `rgba(175, 255, 43, ${opacity})`,
								labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
								style: {
									borderRadius: 16
								},
								propsForDots: {
									r: '4',
									strokeWidth: '2',
									stroke: '#AFFF2B'
								}
							}}
							bezier
							style={styles.chart}
						/>
					) : (
						<View style={styles.emptyChart}>
							<Ionicons name='analytics-outline' size={48} color='#333333' />
							<Text style={styles.emptyChartText}>No weight data yet</Text>
							<Text style={styles.emptyChartSubtext}>
								Start tracking your weight in the Weight tab
							</Text>
						</View>
					)}
				</View>

				{/* Workout Stats Overview */}
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Workout Stats</Text>

					<View style={styles.statsGrid}>
						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='barbell-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{completedSessions.length}</Text>
							<Text style={styles.statLabel}>Workouts</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='flame-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{streak}</Text>
							<Text style={styles.statLabel}>Day Streak</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons
									name='trending-up-outline'
									size={20}
									color='#AFFF2B'
								/>
							</View>
							<Text style={styles.statValue}>
								{Math.round(totalVolume).toLocaleString()}
							</Text>
							<Text style={styles.statLabel}>Total Volume</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='list-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{totalSets}</Text>
							<Text style={styles.statLabel}>Total Sets</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='repeat-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{totalReps}</Text>
							<Text style={styles.statLabel}>Total Reps</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='calendar-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>
								{completedSessions.length > 0
									? (totalVolume / completedSessions.length).toFixed(0)
									: 0}
							</Text>
							<Text style={styles.statLabel}>Avg Volume</Text>
						</View>
					</View>
				</View>

				{/* Cardio Stats */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Text style={styles.sectionTitle}>Cardio Stats</Text>
						<Ionicons name='bicycle' size={20} color='#AFFF2B' />
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='bicycle-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{cardioSessions.length}</Text>
							<Text style={styles.statLabel}>Sessions</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='time-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>
								{Math.round(totalCardioTime)}
							</Text>
							<Text style={styles.statLabel}>Minutes</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='location-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>
								{totalCardioDistance > 0 ? totalCardioDistance.toFixed(1) : 0}
							</Text>
							<Text style={styles.statLabel}>Miles</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='flame-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>{cardioStreak}</Text>
							<Text style={styles.statLabel}>Week Streak</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons
									name='speedometer-outline'
									size={20}
									color='#AFFF2B'
								/>
							</View>
							<Text style={styles.statValue}>
								{cardioSessions.length > 0
									? Math.round(totalCardioTime / cardioSessions.length)
									: 0}
							</Text>
							<Text style={styles.statLabel}>Avg Duration</Text>
						</View>

						<View style={styles.statBox}>
							<View style={styles.statIconBadge}>
								<Ionicons name='calendar-outline' size={20} color='#AFFF2B' />
							</View>
							<Text style={styles.statValue}>
								{cardioSessions.length > 0 && totalCardioDistance > 0
									? (
											totalCardioDistance /
											cardioSessions.filter((s) => s.distance).length
										).toFixed(1)
									: 0}
							</Text>
							<Text style={styles.statLabel}>Avg Distance</Text>
						</View>
					</View>

					{/* Recent Cardio Activity */}
					{cardioSessions.length > 0 && (
						<View style={styles.recentCardio}>
							<Text style={styles.recentCardioTitle}>Recent Activity</Text>
							<View style={styles.recentCardioList}>
								{cardioSessions.slice(0, 5).map((session) => {
									const cardioType = CARDIO_TYPES.find(
										(t) => t.id === session.type
									);
									return (
										<View key={session.id} style={styles.recentCardioItem}>
											<View style={styles.recentCardioLeft}>
												<View style={styles.recentCardioIcon}>
													<Ionicons
														name={cardioType?.icon || 'bicycle'}
														size={16}
														color='#AFFF2B'
													/>
												</View>
												<View>
													<Text style={styles.recentCardioType}>
														{cardioType?.label || session.type}
													</Text>
													<Text style={styles.recentCardioDate}>
														{new Date(session.date).toLocaleDateString()}
													</Text>
												</View>
											</View>
											<View style={styles.recentCardioStats}>
												<Text style={styles.recentCardioStat}>
													{session.duration} min
												</Text>
												{session.distance && (
													<Text style={styles.recentCardioStat}>
														{session.distance} mi
													</Text>
												)}
											</View>
										</View>
									);
								})}
							</View>
						</View>
					)}

					{cardioSessions.length === 0 && (
						<View style={styles.emptyRecords}>
							<Ionicons name='bicycle-outline' size={48} color='#333333' />
							<Text style={styles.emptyRecordsText}>
								No cardio sessions yet
							</Text>
							<Text style={styles.emptyRecordsSubtext}>
								Start logging cardio from the Workout tab
							</Text>
						</View>
					)}
				</View>

				{/* Personal Records */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Text style={styles.sectionTitle}>Personal Records</Text>
						<Ionicons name='trophy' size={20} color='#FFD60A' />
					</View>

					{bestVolumeSession || bestSet || mostSetsSession ? (
						<View style={styles.recordsList}>
							{bestVolumeSession && (
								<View style={styles.recordItem}>
									<View style={styles.recordIcon}>
										<Ionicons name='trending-up' size={18} color='#AFFF2B' />
									</View>
									<View style={styles.recordContent}>
										<Text style={styles.recordLabel}>Highest Volume</Text>
										<Text style={styles.recordValue}>
											{Math.round(bestVolumeSession.volume).toLocaleString()}{' '}
											lbs
										</Text>
										<Text style={styles.recordMeta}>
											{bestVolumeSession.title} •{' '}
											{new Date(bestVolumeSession.date).toLocaleDateString()}
										</Text>
									</View>
								</View>
							)}

							{bestSet && (
								<View style={styles.recordItem}>
									<View style={styles.recordIcon}>
										<Ionicons name='barbell' size={18} color='#AFFF2B' />
									</View>
									<View style={styles.recordContent}>
										<Text style={styles.recordLabel}>Best Set</Text>
										<Text style={styles.recordValue}>
											{bestSet.weight} lbs × {bestSet.reps} reps
										</Text>
										<Text style={styles.recordMeta}>
											{bestSet.exerciseName}
										</Text>
									</View>
								</View>
							)}

							{mostSetsSession && (
								<View style={styles.recordItem}>
									<View style={styles.recordIcon}>
										<Ionicons name='list' size={18} color='#AFFF2B' />
									</View>
									<View style={styles.recordContent}>
										<Text style={styles.recordLabel}>Most Sets</Text>
										<Text style={styles.recordValue}>
											{mostSetsSession.sets} sets
										</Text>
										<Text style={styles.recordMeta}>
											{mostSetsSession.title} •{' '}
											{new Date(mostSetsSession.date).toLocaleDateString()}
										</Text>
									</View>
								</View>
							)}
						</View>
					) : (
						<View style={styles.emptyRecords}>
							<Ionicons name='trophy-outline' size={48} color='#333333' />
							<Text style={styles.emptyRecordsText}>No records yet</Text>
							<Text style={styles.emptyRecordsSubtext}>
								Complete workouts to start tracking your achievements
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 40
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12
	},
	loadingText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	header: {
		marginBottom: 16
	},
	title: {
		fontSize: 26,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	subtitle: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4
	},

	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	changeText: {
		fontSize: 13,
		fontWeight: '900',
		marginTop: 4
	},
	changePositive: {
		color: '#FF453A'
	},
	changeNegative: {
		color: '#AFFF2B'
	},
	changeNeutral: {
		color: '#999999'
	},

	rangeSelector: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 16
	},
	rangeButton: {
		flex: 1,
		height: 36,
		borderRadius: 10,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
	},
	rangeButtonActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	rangeButtonText: {
		fontSize: 13,
		fontWeight: '900',
		color: '#666666'
	},
	rangeButtonTextActive: {
		color: '#000000'
	},

	chart: {
		marginVertical: 8,
		borderRadius: 16
	},

	emptyChart: {
		alignItems: 'center',
		paddingVertical: 40
	},
	emptyChartText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginTop: 12
	},
	emptyChartSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center'
	},

	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		marginTop: 12
	},
	statBox: {
		width: '31%',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 12,
		alignItems: 'center'
	},
	statIconBadge: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8
	},
	statValue: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 4
	},
	statLabel: {
		fontSize: 10,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center'
	},

	recordsList: {
		gap: 12
	},
	recordItem: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 12
	},
	recordIcon: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	recordContent: {
		flex: 1
	},
	recordLabel: {
		fontSize: 11,
		fontWeight: '800',
		color: '#999999',
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	recordValue: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		marginTop: 4
	},
	recordMeta: {
		fontSize: 11,
		fontWeight: '700',
		color: '#666666',
		marginTop: 4
	},

	emptyRecords: {
		alignItems: 'center',
		paddingVertical: 32
	},
	emptyRecordsText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginTop: 12
	},
	emptyRecordsSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center',
		paddingHorizontal: 20
	},
	recentCardio: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A'
	},
	recentCardioTitle: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	recentCardioList: {
		gap: 10
	},
	recentCardioItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#2A2A2A',
		borderRadius: 10,
		padding: 10
	},
	recentCardioLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1
	},
	recentCardioIcon: {
		width: 32,
		height: 32,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	recentCardioType: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	recentCardioDate: {
		fontSize: 10,
		fontWeight: '700',
		color: '#666666',
		marginTop: 2
	},
	recentCardioStats: {
		alignItems: 'flex-end'
	},
	recentCardioStat: {
		fontSize: 11,
		fontWeight: '700',
		color: '#999999'
	}
});
