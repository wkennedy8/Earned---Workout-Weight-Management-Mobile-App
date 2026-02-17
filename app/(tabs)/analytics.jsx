import { useAuth } from '@/context/AuthContext';
import { CARDIO_TYPES, getAllCardio } from '@/controllers/cardioController';
import { getUserWorkoutPlan } from '@/controllers/plansController';
import { getProgramWeek } from '@/controllers/programProgressController';
import { computeSessionStats } from '@/controllers/sessionController';
import { getRecentWeights } from '@/controllers/weightController';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

// Components
import CardioStatsCard from '@/components/analytics/CardioStatsCard';
import OverallStatsCard from '@/components/analytics/OverallStatsCard';
import PersonalRecordsCard from '@/components/analytics/PersonalRecordsCard';
import WeeklyProgressCard from '@/components/analytics/WeeklyProgressCard';
import WeightProgressChart from '@/components/analytics/WeightProgressChart';

// Utilities
import {
	calculateCardioStreak,
	calculateStreak,
	calculateWeekStats,
	groupSessionsByWeek,
	prepareChartData,
	sampleWeights
} from '@/utils/analyticsUtils';

export default function AnalyticsScreen() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);

	// Weight data
	const [weights, setWeights] = useState([]);
	const [weightRange, setWeightRange] = useState('7');

	// Workout stats
	const [completedSessions, setCompletedSessions] = useState([]);
	const [totalVolume, setTotalVolume] = useState(0);
	const [totalSets, setTotalSets] = useState(0);
	const [totalReps, setTotalReps] = useState(0);
	const [streak, setStreak] = useState(0);

	// Weekly breakdown
	const [currentWeek, setCurrentWeek] = useState(1);
	const [weeklyStats, setWeeklyStats] = useState({});

	// Personal records
	const [bestVolumeSession, setBestVolumeSession] = useState(null);
	const [bestSet, setBestSet] = useState(null);
	const [mostSetsSession, setMostSetsSession] = useState(null);

	// Cardio
	const [cardioSessions, setCardioSessions] = useState([]);
	const [totalCardioTime, setTotalCardioTime] = useState(0);
	const [totalCardioDistance, setTotalCardioDistance] = useState(0);
	const [cardioStreak, setCardioStreak] = useState(0);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				setLoading(true);

				// Load user's workout plan
				const plan = await getUserWorkoutPlan(user.uid);
				const planId = plan?.id || 'ppl';

				// Get current program week
				const week = await getProgramWeek(user.uid, planId);
				setCurrentWeek(week);

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
						const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
						const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
						return dateB - dateA;
					});

				setCompletedSessions(sessions);

				// Group sessions by week
				const weekMap = groupSessionsByWeek(sessions);
				const weekStats = {};

				Object.keys(weekMap).forEach((week) => {
					weekStats[week] = calculateWeekStats(
						weekMap[week],
						computeSessionStats
					);
				});

				setWeeklyStats(weekStats);

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

					if (stats.totalVolume > bestVolume) {
						bestVolume = stats.totalVolume;
						bestVolumeSessionData = {
							title: session.title,
							volume: stats.totalVolume,
							date: session.date
						};
					}

					if (stats.bestSet) {
						const setValue = stats.bestSet.weight * stats.bestSet.reps;
						if (setValue > globalBestSetValue) {
							globalBestSetValue = setValue;
							globalBestSet = stats.bestSet;
						}
					}

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

	// Filter and sample weights
	const filteredWeights = weights.filter((w) => {
		const days = parseInt(weightRange);
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);
		const weightDate = new Date(w.date);
		return weightDate >= cutoff;
	});

	const sampledWeights = sampleWeights(filteredWeights, weightRange);
	const chartData = prepareChartData(sampledWeights);

	const weightChange =
		sampledWeights.length >= 2
			? sampledWeights[0].weight -
				sampledWeights[sampledWeights.length - 1].weight
			: 0;

	// Determine which weeks to show
	const weeksToShow = [];
	for (let week = 1; week <= currentWeek; week++) {
		weeksToShow.push(week);
	}

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
				<WeightProgressChart
					sampledWeights={sampledWeights}
					weightChange={weightChange}
					weightRange={weightRange}
					onRangeChange={setWeightRange}
					chartData={chartData}
				/>

				{/* Overall Stats */}
				<OverallStatsCard
					completedSessions={completedSessions}
					streak={streak}
					totalVolume={totalVolume}
					totalSets={totalSets}
					totalReps={totalReps}
					currentWeek={currentWeek}
				/>

				{/* Weekly Progress */}
				<WeeklyProgressCard
					weeklyStats={weeklyStats}
					weeksToShow={weeksToShow}
					currentWeek={currentWeek}
				/>

				{/* Cardio Stats */}
				<CardioStatsCard
					cardioSessions={cardioSessions}
					totalCardioTime={totalCardioTime}
					totalCardioDistance={totalCardioDistance}
					cardioStreak={cardioStreak}
					CARDIO_TYPES={CARDIO_TYPES}
				/>

				{/* Personal Records */}
				<PersonalRecordsCard
					bestVolumeSession={bestVolumeSession}
					bestSet={bestSet}
					mostSetsSession={mostSetsSession}
				/>
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
	}
});
