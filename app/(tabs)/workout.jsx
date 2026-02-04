import CardioModal from '@/components/CardioModal';
import { useAuth } from '@/context/AuthContext';
import {
	getCardioForDate,
	logCardioSession
} from '@/controllers/cardioController';
import { getUserWorkoutPlan } from '@/controllers/plansController';
import {
	getProgramWeek,
	resolveExerciseProgression
} from '@/controllers/programProgressController';
import {
	getScheduleOverride,
	markAsRestDayAndReschedule
} from '@/controllers/rescheduleController';
import {
	computeSessionStats,
	shareCompletedSession
} from '@/controllers/sessionController';
import { useTodayWorkoutSession } from '@/hooks/useTodayWorkoutSession';
import { formatLongDate } from '@/utils/dateUtils';
import { formatLocalDateKey } from '@/utils/weightUtils';
import { getWorkoutForDateWithOverride, tagColor } from '@/utils/workoutPlan';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

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
	const { user } = useAuth();

	const [userPlan, setUserPlan] = useState(null);
	const [loadingPlan, setLoadingPlan] = useState(true);
	const [workout, setWorkout] = useState(null);
	const [currentWeek, setCurrentWeek] = useState(1);
	const [planId, setPlanId] = useState(null);

	const [cardioModalVisible, setCardioModalVisible] = useState(false);
	const [cardioSession, setCardioSession] = useState(null);

	const [markedAsRest, setMarkedAsRest] = useState(false);

	const today = useMemo(() => new Date(), []);
	const todayKey = useMemo(() => formatLocalDateKey(today), [today]);

	// Load user's selected plan and program week
	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				setLoadingPlan(true);
				const plan = await getUserWorkoutPlan(user.uid);
				setUserPlan(plan);
				setPlanId(plan?.id || 'ppl');

				// Get current program week
				const week = await getProgramWeek(user.uid, plan?.id || 'ppl');
				setCurrentWeek(week);

				// Load today's workout with override support
				const todayWorkout = await getWorkoutForDateWithOverride(
					today,
					plan,
					user.uid
				);

				// Apply weekly progression to workout if it has exercises
				if (todayWorkout && todayWorkout.exercises) {
					const progressedWorkout = applyProgressionToWorkout(
						todayWorkout,
						week
					);
					setWorkout(progressedWorkout);
				} else {
					setWorkout(todayWorkout);
				}

				// Check if today was marked as rest
				const override = await getScheduleOverride(user.uid, todayKey);
				if (override && override.workoutId === 'rest') {
					setMarkedAsRest(true);
				}
			} catch (error) {
				console.error('Failed to load workout plan:', error);
			} finally {
				setLoadingPlan(false);
			}
		})();
	}, [user?.uid, todayKey]);

	// Helper function to apply weekly progression to a workout
	function applyProgressionToWorkout(workout, week) {
		if (!workout || !workout.exercises) return workout;

		return {
			...workout,
			exercises: workout.exercises.map((exercise) => {
				// If exercise has weeklyProgression, resolve sets/reps for current week
				if (exercise.weeklyProgression) {
					const resolved = resolveExerciseProgression(exercise, week);
					return {
						...exercise,
						sets: String(resolved.sets),
						reps: String(resolved.reps)
					};
				}
				// Otherwise, keep as is
				return exercise;
			})
		};
	}

	// Check for schedule overrides and reload data
	useFocusEffect(
		useCallback(() => {
			if (!user?.uid || !userPlan) return;
			(async () => {
				try {
					// Reload program week (in case it was advanced elsewhere)
					const week = await getProgramWeek(user.uid, planId || 'ppl');
					setCurrentWeek(week);

					// Check for schedule override
					const overriddenWorkout = await getWorkoutForDateWithOverride(
						today,
						userPlan,
						user.uid
					);

					// Apply progression
					const progressedWorkout = applyProgressionToWorkout(
						overriddenWorkout,
						week
					);
					setWorkout(progressedWorkout);

					// Check if today was marked as rest
					const override = await getScheduleOverride(user.uid, todayKey);

					if (override && override.workoutId === 'rest') {
						setMarkedAsRest(true);
					} else {
						setMarkedAsRest(false);
					}

					// Reload plan
					const plan = await getUserWorkoutPlan(user.uid);
					setUserPlan(plan);

					// Reload cardio session
					const session = await getCardioForDate(user.uid, todayKey);
					setCardioSession(session);
				} catch (error) {
					console.error('Failed to reload data:', error);
				}
			})();
		}, [user?.uid, userPlan, today, todayKey, planId])
	);

	const isRestDay = workout?.id === 'rest';

	const { completedSession, inProgressSession, refresh } =
		useTodayWorkoutSession({
			templateId: workout?.id || 'rest',
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

	async function handleSaveCardio(data) {
		if (!user?.uid) return;

		try {
			await logCardioSession(user.uid, {
				date: todayKey,
				...data
			});

			// Reload cardio session
			const session = await getCardioForDate(user.uid, todayKey);
			setCardioSession(session);

			setCardioModalVisible(false);
			Alert.alert('Success', 'Cardio session logged!');
		} catch (error) {
			console.error('Failed to save cardio:', error);
			Alert.alert('Error', 'Failed to log cardio session');
		}
	}

	async function handleMarkRestDay() {
		if (!user?.uid || !userPlan || !workout) return;

		Alert.alert(
			'Mark as Rest Day',
			`This will move today's workout (${workout.title}) to tomorrow. Your streak will be maintained.\n\nContinue?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Mark as Rest',
					style: 'default',
					onPress: async () => {
						try {
							// Pass the current workout object so it knows exactly what to move
							const result = await markAsRestDayAndReschedule(
								user.uid,
								userPlan,
								todayKey,
								workout // ← Pass the actual workout object
							);

							// Set workout to rest day directly
							setWorkout({
								id: 'rest',
								title: 'Rest Day',
								tag: 'Rest',
								exercises: []
							});
							setMarkedAsRest(true);

							Alert.alert(
								'Success',
								`${result.movedWorkout} has been moved to tomorrow!`
							);
						} catch (error) {
							console.error('Failed to reschedule:', error);
							Alert.alert(
								'Error',
								error.message || 'Failed to reschedule workout'
							);
						}
					}
				}
			]
		);
	}

	// Loading state
	if (loadingPlan || !workout) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
					<Text style={styles.loadingText}>Loading workout...</Text>
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
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						{/* <View style={styles.iconBadge}>
							<Ionicons name='barbell-outline' size={20} color='#AFFF2B' />
						</View> */}
						<View>
							<Text style={styles.title}>{formatLongDate(today)}</Text>
						</View>
					</View>
					{/* Week Badge */}
					{!isRestDay && (
						<View style={styles.weekBadge}>
							<Text style={styles.weekBadgeText}>Week {currentWeek}</Text>
						</View>
					)}
				</View>

				{/* Workout Title */}
				<View style={styles.workoutTitleRow}>
					<View style={styles.workoutTitleLeft}>
						<View
							style={[
								styles.tagPill,
								{ backgroundColor: tagColor(workout.tag) }
							]}
						>
							<Text style={styles.tagText}>{workout.tag}</Text>
						</View>
						<Text style={styles.workoutTitle}>{workout.title}</Text>
					</View>

					{/* Mark as Rest Day Button */}
					{!isRestDay && !completedSession && !inProgressSession && (
						<TouchableOpacity
							style={styles.restDayButton}
							onPress={handleMarkRestDay}
							activeOpacity={0.9}
						>
							<Ionicons name='moon-outline' size={16} color='#999999' />
						</TouchableOpacity>
					)}
				</View>

				{/* Optional Cardio Card */}
				<View style={styles.cardioCard}>
					<View style={styles.cardioHeader}>
						<View style={styles.cardioLeft}>
							<View style={styles.cardioIcon}>
								<Ionicons name='bicycle-outline' size={22} color='#AFFF2B' />
							</View>
							<View>
								<Text style={styles.cardioTitle}>Cardio (Optional)</Text>
								<Text style={styles.cardioSubtitle}>
									{cardioSession
										? `${cardioSession.duration} min ${cardioSession.type}`
										: 'Log your cardio session'}
								</Text>
							</View>
						</View>

						{cardioSession ? (
							<View style={styles.cardioCompleted}>
								<Ionicons name='checkmark-circle' size={28} color='#AFFF2B' />
							</View>
						) : (
							<TouchableOpacity
								style={styles.cardioButton}
								onPress={() => setCardioModalVisible(true)}
								activeOpacity={0.9}
							>
								<Text style={styles.cardioButtonText}>Log</Text>
							</TouchableOpacity>
						)}
					</View>

					{cardioSession && cardioSession.distance && (
						<View style={styles.cardioDetails}>
							<Text style={styles.cardioDetailsText}>
								Distance: {cardioSession.distance} miles
							</Text>
						</View>
					)}
				</View>

				{/* Post-workout Summary or Rest Day Summary */}
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

						{/* Start/Edit Workout Button */}
						<TouchableOpacity
							style={styles.primaryActionButton}
							onPress={onStartWorkout}
							activeOpacity={0.9}
						>
							<Text style={styles.primaryActionButtonText}>
								{startButtonLabel}
							</Text>
						</TouchableOpacity>
					</View>
				) : markedAsRest ? (
					<View style={styles.summaryCard}>
						<View style={styles.summaryHeader}>
							<Text style={styles.summaryTitle}>Rest Day</Text>
							<Text
								style={[styles.summarySubtitle, styles.summarySubtitleRest]}
							>
								Rescheduled
							</Text>
						</View>

						<View style={styles.restDaySummary}>
							<View style={styles.restDayIcon}>
								<Ionicons name='moon' size={32} color='#AFFF2B' />
							</View>
							<Text style={styles.restDayTitle}>Workout Rescheduled</Text>
							<Text style={styles.restDayDescription}>
								Your scheduled workout has been moved to tomorrow. Your streak
								continues!
							</Text>
						</View>

						<View style={styles.restDayInfo}>
							<View style={styles.restDayInfoRow}>
								<Ionicons name='calendar-outline' size={16} color='#AFFF2B' />
								<Text style={styles.restDayInfoText}>
									Tomorrow: Check back for your rescheduled workout
								</Text>
							</View>
							<View style={styles.restDayInfoRow}>
								<Ionicons name='flame-outline' size={16} color='#AFFF2B' />
								<Text style={styles.restDayInfoText}>
									Streak maintained with rest day
								</Text>
							</View>
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
					<>
						<View style={styles.listCard}>
							<Text style={styles.exerciseListTitle}>Exercises</Text>
							{workout.exercises.map((item, idx) => (
								<View key={`${item.name}-${idx}`}>
									{idx > 0 && <View style={styles.rowDivider} />}
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
													{String(item.reps).toLowerCase() === 'time'
														? ''
														: 'reps'}
													{item.note ? ` • ${item.note}` : ''}
												</Text>
											</View>
										</View>
										<Text style={styles.chevron}>›</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>

						{/* Start/Resume Workout Button - Only show if no completed session */}
						{!completedSession && (
							<TouchableOpacity
								style={styles.primaryActionButton}
								onPress={onStartWorkout}
								activeOpacity={0.9}
							>
								<Text style={styles.primaryActionButtonText}>
									{startButtonLabel}
								</Text>
							</TouchableOpacity>
						)}
					</>
				)}

				{/* Bottom spacing for CTA button */}
				<View style={{ height: 80 }} />
			</ScrollView>

			{/* Cardio Modal */}
			<CardioModal
				visible={cardioModalVisible}
				onClose={() => setCardioModalVisible(false)}
				onSave={handleSaveCardio}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 100
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
	weekBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		borderWidth: 1,
		borderColor: '#AFFF2B'
	},
	weekBadgeText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	settingsIcon: { fontSize: 20, color: '#999999' },

	workoutTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 14
	},
	workoutTitleLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1
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

	restDayButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
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
	summarySubtitleRest: {
		color: '#FFD60A'
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

	restDaySummary: {
		alignItems: 'center',
		paddingVertical: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	restDayIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16
	},
	restDayTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	restDayDescription: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center',
		lineHeight: 20,
		paddingHorizontal: 20
	},
	restDayInfo: {
		gap: 12,
		marginTop: 16
	},
	restDayInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10
	},
	restDayInfoText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#FFFFFF',
		flex: 1
	},

	listCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		overflow: 'hidden',
		marginBottom: 12
	},
	exerciseListTitle: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		paddingHorizontal: 14,
		paddingTop: 14,
		paddingBottom: 8
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
	rowDivider: { height: 1, backgroundColor: '#333333', marginHorizontal: 14 },

	restCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
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

	primaryActionButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		shadowColor: '#AFFF2B',
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 5
	},
	primaryActionButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.black
	},
	cardioCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	cardioHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	cardioLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	cardioIcon: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardioTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	cardioSubtitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 2
	},
	cardioCompleted: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardioButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: '#AFFF2B'
	},
	cardioButtonText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#000000'
	},
	cardioDetails: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A'
	},
	cardioDetailsText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999'
	}
});
