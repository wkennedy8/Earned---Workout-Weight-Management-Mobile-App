import {
	computeSessionStats,
	shareCompletedSession
} from '@/controllers/sessionController';
import { useTodayWorkoutSession } from '@/hooks/useTodayWorkoutSession';
import { formatLongDate } from '@/utils/dateUtils';
import { formatLocalDateKey } from '@/utils/weightUtils';
import { getWorkoutForDate, tagColor } from '@/utils/workoutPlan';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts'; // Import font utilities

function getStartButtonLabel({
	isRestDay,
	completedSession,
	inProgressSession
}) {
	if (isRestDay) return 'Rest Day';
	if (completedSession) return 'Edit Workout';
	if (inProgressSession) return 'Resume Workout';
	return 'Start Workout';
}

function getStartNavigationParams({
	workout,
	isRestDay,
	completedSession,
	inProgressSession
}) {
	if (isRestDay) return null;

	if (completedSession) {
		return {
			pathname: '/workout/session',
			params: {
				templateId: workout.id,
				mode: 'edit',
				sessionId: completedSession.id
			}
		};
	}

	if (inProgressSession) {
		return {
			pathname: '/workout/session',
			params: {
				templateId: workout.id,
				mode: 'resume',
				sessionId: inProgressSession.id
			}
		};
	}

	return {
		pathname: '/workout/session',
		params: { templateId: workout.id, mode: 'start' }
	};
}

export default function WorkoutTab() {
	const router = useRouter();

	const today = useMemo(() => new Date(), []);
	const todayKey = useMemo(() => formatLocalDateKey(today), [today]);
	// const workout = useMemo(() => getWorkoutForDate(today), [today]);
	const workout = useMemo(() => {
		const result = getWorkoutForDate(today);
		console.log('Workout for today:', result);
		return result;
	}, [today]);

	const isRestDay = workout.id === 'rest';

	const { completedSession, inProgressSession, refresh } =
		useTodayWorkoutSession({
			templateId: workout.id,
			dateKey: todayKey
		});

	useFocusEffect(
		useCallback(() => {
			refresh();
		}, [refresh])
	);

	const stats = useMemo(() => {
		if (!completedSession) return null;
		return computeSessionStats(completedSession);
	}, [completedSession]);

	const onPressShare = useCallback(() => {
		if (!completedSession) return;
		shareCompletedSession(completedSession);
	}, [completedSession]);

	const startButtonLabel = useMemo(() => {
		return getStartButtonLabel({
			isRestDay,
			completedSession,
			inProgressSession
		});
	}, [isRestDay, completedSession, inProgressSession]);

	const onStartWorkout = useCallback(() => {
		if (isRestDay) {
			Alert.alert('Rest Day', 'No workout scheduled today.');
			return;
		}

		const nav = getStartNavigationParams({
			workout,
			isRestDay,
			completedSession,
			inProgressSession
		});

		if (nav) router.push(nav);
	}, [router, workout, isRestDay, completedSession, inProgressSession]);

	const onPressExercise = useCallback((item) => {
		Alert.alert(
			item.name,
			`${item.sets} sets • ${item.reps}${item.note ? `\n\nNote: ${item.note}` : ''}`
		);
	}, []);

	const renderExerciseItem = useCallback(
		({ item }) => (
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={() => onPressExercise(item)}
				style={styles.exerciseRow}
			>
				<View style={styles.exerciseLeft}>
					<View style={styles.exerciseIcon}>
						<Text style={styles.exerciseIconText}>•</Text>
					</View>
					<View>
						<Text style={styles.exerciseName}>{item.name}</Text>
						<Text style={styles.exerciseMeta}>
							{item.sets} sets, {item.reps}{' '}
							{String(item.reps).toLowerCase() === 'time' ? '' : 'reps'}
							{item.note ? ` • ${item.note}` : ''}
						</Text>
					</View>
				</View>
				<Text style={styles.chevron}>›</Text>
			</TouchableOpacity>
		),
		[onPressExercise]
	);

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<View style={styles.iconBadge}>
							<Ionicons name='barbell-outline' size={20} color='#AFFF2B' />
						</View>
						<View>
							<Text style={styles.title}>{formatLongDate(today)}</Text>
						</View>
					</View>

					{/* <TouchableOpacity
						onPress={onPressSettings}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					>
						<Text style={styles.settingsIcon}>⚙️</Text>
					</TouchableOpacity> */}
				</View>

				{/* Workout Title */}
				<View style={styles.workoutTitleRow}>
					<View
						style={[styles.tagPill, { backgroundColor: tagColor(workout.tag) }]}
					>
						<Text style={styles.tagText}>{workout.tag}</Text>
					</View>
					<Text style={styles.workoutTitle}>{workout.title}</Text>
				</View>

				{/* Post-workout Summary */}
				{completedSession && stats ? (
					<View style={styles.summaryCard}>
						<View style={styles.summaryHeader}>
							<Text style={styles.summaryTitle}>Workout Summary</Text>
							<Text style={styles.summarySubtitle}>Completed today</Text>
						</View>

						<View style={styles.statsGrid}>
							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Exercises</Text>
								<Text style={styles.statValue}>
									{stats.exercisesCompleted}/{stats.exercisesPlanned}
								</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Sets</Text>
								<Text style={styles.statValue}>{stats.totalSets}</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Reps</Text>
								<Text style={styles.statValue}>{stats.totalReps}</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Volume</Text>
								<Text style={styles.statValue}>
									{Math.round(stats.totalVolume).toLocaleString()}
								</Text>
							</View>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryRowLabel}>Duration</Text>
							<Text style={styles.summaryRowValue}>
								{stats.durationSeconds != null
									? `${stats.durationSeconds}s`
									: '—'}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryRowLabel}>Best Set</Text>
							<Text style={styles.summaryRowValue}>
								{stats.bestSet
									? `${stats.bestSet.exerciseName}: ${stats.bestSet.weight} × ${stats.bestSet.reps}`
									: '—'}
							</Text>
						</View>

						<View style={styles.summaryActions}>
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={() =>
									router.push({
										pathname: '/workout/details',
										params: { sessionId: completedSession.id }
									})
								}
								activeOpacity={0.9}
							>
								<Text style={styles.secondaryButtonText}>View Details</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={onPressShare}
								activeOpacity={0.9}
							>
								<Text style={styles.secondaryButtonText}>Share</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : null}

				{/* Exercise list */}
				{isRestDay ? (
					<View style={styles.restCard}>
						<Text style={styles.restTitle}>No workout scheduled</Text>
						<Text style={styles.restBody}>
							Recovery day. Consider mobility, stretching, or a light walk.
						</Text>
					</View>
				) : (
					<View style={styles.listCard}>
						<FlatList
							data={workout.exercises}
							keyExtractor={(item, idx) => `${item.name}-${idx}`}
							ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
							renderItem={renderExerciseItem}
						/>
					</View>
				)}

				{/* Bottom CTA */}
				<View style={styles.bottomCtaWrap}>
					<TouchableOpacity
						style={[
							styles.startButton,
							isRestDay && styles.startButtonDisabled
						]}
						onPress={onStartWorkout}
						activeOpacity={0.9}
						disabled={isRestDay}
					>
						<Text style={styles.startButtonText}>{startButtonLabel}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000', paddingBottom: 90 },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
	iconBadge: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 18 },
	title: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	settingsIcon: { fontSize: 20, color: '#999999' },

	workoutTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 14
	},
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: {
		color: '#FFFFFF',
		fontFamily: FontFamily.bold,
		fontSize: 12
	},
	workoutTitle: {
		fontSize: 22,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},

	summaryCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	summaryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline'
	},
	summaryTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	summarySubtitle: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#AFFF2B'
	},

	statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
	statBox: {
		width: '48%',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		padding: 12,
		backgroundColor: '#0D0D0D'
	},
	statLabel: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},
	statValue: {
		marginTop: 4,
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF'
	},

	summaryRow: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12
	},
	summaryRowLabel: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#999999'
	},
	summaryRowValue: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		flex: 1,
		textAlign: 'right'
	},

	summaryActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
	secondaryButton: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	secondaryButtonText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	listCard: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		overflow: 'hidden'
	},

	exerciseRow: {
		paddingHorizontal: 14,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	exerciseLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	exerciseIcon: {
		width: 34,
		height: 34,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseIconText: {
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},
	exerciseName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	exerciseMeta: {
		fontSize: 12,
		fontFamily: FontFamily.semiBold,
		color: '#999999',
		marginTop: 2
	},
	chevron: {
		fontSize: 24,
		fontFamily: FontFamily.bold,
		color: '#666666',
		marginLeft: 10
	},
	rowDivider: { height: 1, backgroundColor: '#333333' },

	restCard: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16
	},
	restTitle: {
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		marginBottom: 8
	},
	restBody: {
		fontSize: 13,
		fontFamily: FontFamily.semiBold,
		color: '#999999',
		lineHeight: 18
	},

	placeholder: {
		fontSize: 14,
		color: '#999999',
		marginTop: 20
	},

	bottomCtaWrap: { paddingTop: 12, paddingBottom: 12 },
	startButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#AFFF2B',
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 5
	},
	startButtonDisabled: { backgroundColor: '#333333' },
	startButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.black
	}
});
