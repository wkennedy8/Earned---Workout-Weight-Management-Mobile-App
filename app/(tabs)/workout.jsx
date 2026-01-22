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

import {
	computeSessionStats,
	shareCompletedSession
} from '@/controllers/sessionController';
import { useTodayWorkoutSession } from '@/hooks/useTodayWorkoutSession';
import { formatLongDate } from '@/utils/dateUtils';
import { formatLocalDateKey } from '@/utils/weightUtils';
import { getWorkoutForDate, tagColor } from '@/utils/workoutPlan';

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
	const workout = useMemo(() => getWorkoutForDate(today), [today]);

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

	const onPressSettings = useCallback(() => {
		Alert.alert('Settings', 'Settings screen not wired yet.');
	}, []);

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
							<Text style={styles.iconText}>🏋️</Text>
						</View>
						<View>
							<Text style={styles.title}>{formatLongDate(today)}</Text>
						</View>
					</View>

					<TouchableOpacity
						onPress={onPressSettings}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					>
						<Text style={styles.settingsIcon}>⚙️</Text>
					</TouchableOpacity>
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
	safe: { flex: 1, backgroundColor: '#FFFFFF', paddingBottom: 90 },
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
		backgroundColor: '#EFF4FF',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 18 },
	title: { fontSize: 18, fontWeight: '900', color: '#0B1220' },
	settingsIcon: { fontSize: 20, color: '#6B7280' },

	workoutTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 14
	},
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
	workoutTitle: { fontSize: 22, fontWeight: '900', color: '#0B1220' },

	summaryCard: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14,
		marginBottom: 12
	},
	summaryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline'
	},
	summaryTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
	summarySubtitle: { fontSize: 12, fontWeight: '800', color: '#10B981' },

	statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
	statBox: {
		width: '48%',
		borderWidth: 1,
		borderColor: '#EEF2F7',
		borderRadius: 14,
		padding: 12,
		backgroundColor: '#FAFBFF'
	},
	statLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
	statValue: {
		marginTop: 4,
		fontSize: 18,
		fontWeight: '900',
		color: '#0B1220'
	},

	summaryRow: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12
	},
	summaryRowLabel: { fontSize: 12, fontWeight: '900', color: '#6B7280' },
	summaryRowValue: {
		fontSize: 12,
		fontWeight: '900',
		color: '#111827',
		flex: 1,
		textAlign: 'right'
	},

	summaryActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
	secondaryButton: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center'
	},
	secondaryButtonText: { fontSize: 14, fontWeight: '900', color: '#1E66F5' },

	listCard: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
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
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseIconText: { fontSize: 18, fontWeight: '900', color: '#6B7280' },
	exerciseName: { fontSize: 16, fontWeight: '900', color: '#111827' },
	exerciseMeta: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		marginTop: 2
	},
	chevron: {
		fontSize: 24,
		fontWeight: '900',
		color: '#9CA3AF',
		marginLeft: 10
	},
	rowDivider: { height: 1, backgroundColor: '#EEF2F7' },

	restCard: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 16
	},
	restTitle: {
		fontSize: 18,
		fontWeight: '900',
		color: '#0B1220',
		marginBottom: 8
	},
	restBody: {
		fontSize: 13,
		fontWeight: '700',
		color: '#6B7280',
		lineHeight: 18
	},

	placeholder: { fontSize: 14, color: '#6B7280', marginTop: 20 },

	bottomCtaWrap: { paddingTop: 12, paddingBottom: 12 },
	startButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#1E66F5',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 2
	},
	startButtonDisabled: { backgroundColor: '#9CA3AF' },
	startButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' }
});
