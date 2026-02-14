import SwapExerciseModal from '@/components/SwapExerciseModal';
import ExerciseCard from '@/components/workout/session/ExerciseCard';
import FinishWorkoutButton from '@/components/workout/session/FinishWorkoutButton';
import RestTimerModal from '@/components/workout/session/RestTimerModal';
import SessionHeader from '@/components/workout/session/SessionHeader';
import { useAuth } from '@/context/AuthContext';
import {
	getSmartDefaultWeight,
	loadExerciseDefaults,
	saveExerciseDefaults
} from '@/controllers/exerciseDefaultsController';
import {
	applyWeeklyProgression,
	getProgramWeek
} from '@/controllers/programProgressController';
import {
	buildEmptySession,
	upsertSession as firestoreUpsertSession,
	getInProgressSessionForDay,
	getPreviousExerciseData,
	getSessionById,
	markSessionCompleted
} from '@/controllers/sessionController';
import { formatLocalDateKey } from '@/utils/dateUtils';
import {
	isExerciseCompleted,
	isNumericTargetReps,
	validateSetBeforeSave
} from '@/utils/sessionUtils';
import { playChime } from '@/utils/timerUtils';
import { PLAN } from '@/utils/workoutPlan';
import {
	normalizeExerciseKey,
	normalizeNumberText
} from '@/utils/workoutUtils';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	AppState,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function WorkoutSessionScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const params = useLocalSearchParams();
	const templateId = String(params.templateId || 'push');

	// Find which plan this workout belongs to
	const { template: rawTemplate, planId } = useMemo(() => {
		for (const [pId, plan] of Object.entries(PLAN)) {
			if (plan.workouts && plan.workouts[templateId]) {
				return { template: plan.workouts[templateId], planId: pId };
			}
		}
		return { template: PLAN.ppl?.workouts?.push || null, planId: 'ppl' };
	}, [templateId]);

	const today = useMemo(() => new Date(), []);
	const dateKey = useMemo(() => formatLocalDateKey(today), [today]);

	// State
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [exerciseDefaults, setExerciseDefaults] = useState({});
	const [swapModalVisible, setSwapModalVisible] = useState(false);
	const [swapExerciseIndex, setSwapExerciseIndex] = useState(null);
	const [currentWeek, setCurrentWeek] = useState(1);
	const [template, setTemplate] = useState(null);
	const [previousSessionData, setPreviousSessionData] = useState({});

	// Rest timer state
	const [restVisible, setRestVisible] = useState(false);
	const [restTimerEndTime, setRestTimerEndTime] = useState(null);
	const [restSeconds, setRestSeconds] = useState(0);
	const [restPaused, setRestPaused] = useState(false);
	const [pausedAtSeconds, setPausedAtSeconds] = useState(0);
	const [initialRestSeconds, setInitialRestSeconds] = useState(0);
	const [restContext, setRestContext] = useState(null);
	const restIntervalRef = useRef(null);
	const progress = useSharedValue(0);
	const appState = useRef(AppState.currentState);

	// ============================================================================
	// EFFECTS
	// ============================================================================

	// Load program week and apply progression
	useEffect(() => {
		if (!user?.uid || !rawTemplate || !planId) return;

		(async () => {
			try {
				const week = await getProgramWeek(user.uid, planId);
				setCurrentWeek(week);
				const progressedTemplate = applyWeeklyProgression(rawTemplate, week);
				setTemplate(progressedTemplate);
			} catch (error) {
				console.error('Error loading program week:', error);
				setTemplate(rawTemplate);
			}
		})();
	}, [user?.uid, rawTemplate, planId]);

	// Handle app state changes (background/foreground)
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				if (restTimerEndTime && !restPaused) {
					const now = Date.now();
					const remaining = Math.max(
						0,
						Math.ceil((restTimerEndTime - now) / 1000)
					);
					setRestSeconds(remaining);

					if (remaining === 0) {
						stopRestTimer();
						playChime();
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					}
				}
			}
			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, [restTimerEndTime, restPaused]);

	// Update timer display every second
	useEffect(() => {
		if (restTimerEndTime && !restPaused) {
			if (restIntervalRef.current) {
				clearInterval(restIntervalRef.current);
			}

			restIntervalRef.current = setInterval(() => {
				const now = Date.now();
				const remaining = Math.max(
					0,
					Math.ceil((restTimerEndTime - now) / 1000)
				);
				setRestSeconds(remaining);

				if (remaining === 0) {
					stopRestTimer();
					playChime();
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				}
			}, 1000);

			return () => {
				if (restIntervalRef.current) {
					clearInterval(restIntervalRef.current);
				}
			};
		}
	}, [restTimerEndTime, restPaused]);

	// Init session (resume or create)
	useEffect(() => {
		if (!user?.uid || !template) return;

		(async () => {
			try {
				setLoading(true);

				const mode = String(params.mode || 'start');
				const sessionId = params.sessionId ? String(params.sessionId) : null;

				// EDIT MODE
				if (mode === 'edit') {
					if (!sessionId) {
						throw new Error('Missing sessionId for edit mode');
					}

					const found = await getSessionById(user.uid, sessionId);
					if (!found) {
						throw new Error('Session not found');
					}

					const normalized = {
						...found,
						exercises: found.exercises.map((ex, idx) => ({
							expanded: idx === 0,
							...ex,
							sets: (ex.sets || []).map((s) => ({
								saved: s.saved ?? false,
								savedAt: s.savedAt ?? null,
								...s
							}))
						}))
					};

					setSession(normalized);
					await firestoreUpsertSession(user.uid, normalized);
					return;
				}

				// RESUME MODE
				if (mode === 'resume' && sessionId) {
					const found = await getSessionById(user.uid, sessionId);
					if (found) {
						const normalized = {
							...found,
							exercises: found.exercises.map((ex, idx) => ({
								expanded: idx === 0,
								...ex,
								sets: (ex.sets || []).map((s) => ({
									saved: s.saved ?? false,
									savedAt: s.savedAt ?? null,
									...s
								}))
							}))
						};

						setSession(normalized);
						await firestoreUpsertSession(user.uid, normalized);
						return;
					}
				}

				// START / FALLBACK
				const existing = await getInProgressSessionForDay(user.uid, {
					templateId: template.id,
					dateKey
				});

				if (existing) {
					const normalized = {
						...existing,
						exercises: existing.exercises.map((ex, idx) => ({
							expanded: idx === 0,
							...ex,
							sets: (ex.sets || []).map((s) => ({
								saved: s.saved ?? false,
								savedAt: s.savedAt ?? null,
								...s
							}))
						}))
					};

					setSession(normalized);
					await firestoreUpsertSession(user.uid, normalized);
					return;
				}

				// CREATE NEW SESSION WITH SMART DEFAULTS
				const smartDefaults = {};

				for (const exercise of template.exercises) {
					const smartWeight = await getSmartDefaultWeight(
						user.uid,
						exercise.name,
						template.id
					);

					if (smartWeight !== null) {
						const exerciseKey = normalizeExerciseKey(exercise.name);
						smartDefaults[exerciseKey] = {
							defaultWeight: smartWeight
						};
					}
				}

				setExerciseDefaults(smartDefaults);

				const created = buildEmptySession({
					template,
					defaultsMap: smartDefaults
				});
				created.exercises[0].expanded = true;
				created.programWeek = currentWeek;

				setSession(created);
				await firestoreUpsertSession(user.uid, created);
			} catch (e) {
				console.warn(e);
				Alert.alert('Error', 'Could not initialize workout session.');
			} finally {
				setLoading(false);
			}
		})();

		return () => {
			if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		};
	}, [user?.uid, template, params.mode, params.sessionId, currentWeek]);

	// Load previous session data for all exercises
	useEffect(() => {
		if (!user?.uid || !template || !session) return;

		(async () => {
			try {
				const prevData = {};

				for (const exercise of template.exercises) {
					const data = await getPreviousExerciseData(
						user.uid,
						template.id,
						exercise.name
					);

					if (data) {
						prevData[exercise.name] = data;
					}
				}

				setPreviousSessionData(prevData);
			} catch (error) {
				console.error('Error loading previous session data:', error);
			}
		})();
	}, [user?.uid, template?.id, session?.id]);

	// Update progress animation
	useEffect(() => {
		if (initialRestSeconds > 0) {
			const newProgress = restSeconds / initialRestSeconds;
			progress.value = withTiming(newProgress, { duration: 300 });
		}
	}, [restSeconds, initialRestSeconds]);

	// ============================================================================
	// REST TIMER FUNCTIONS
	// ============================================================================

	function startRestTimer({ seconds, context }) {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current);

		const endTime = Date.now() + seconds * 1000;

		setRestContext(context);
		setRestTimerEndTime(endTime);
		setRestSeconds(seconds);
		setInitialRestSeconds(seconds);
		setRestVisible(true);
		setRestPaused(false);
		setPausedAtSeconds(0);
		progress.value = 1;
	}

	function stopRestTimer() {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		restIntervalRef.current = null;
		setRestTimerEndTime(null);
		setRestSeconds(0);
		setRestVisible(false);
		setRestPaused(false);
		setPausedAtSeconds(0);
	}

	function skipRest() {
		stopRestTimer();
	}

	function addRest(secondsToAdd) {
		if (!restTimerEndTime) return;

		if (restPaused) {
			const newPausedSeconds = pausedAtSeconds + secondsToAdd;
			setPausedAtSeconds(newPausedSeconds);
			setRestSeconds(newPausedSeconds);
		} else {
			const newEndTime = restTimerEndTime + secondsToAdd * 1000;
			setRestTimerEndTime(newEndTime);
			const remaining = Math.max(
				0,
				Math.ceil((newEndTime - Date.now()) / 1000)
			);
			setRestSeconds(remaining);
		}
	}

	function subtractRest(secondsToSubtract) {
		if (!restTimerEndTime) return;

		if (restPaused) {
			const newPausedSeconds = Math.max(0, pausedAtSeconds - secondsToSubtract);
			setPausedAtSeconds(newPausedSeconds);
			setRestSeconds(newPausedSeconds);
		} else {
			const newEndTime = restTimerEndTime - secondsToSubtract * 1000;
			const now = Date.now();

			if (newEndTime <= now) {
				stopRestTimer();
			} else {
				setRestTimerEndTime(newEndTime);
				const remaining = Math.max(0, Math.ceil((newEndTime - now) / 1000));
				setRestSeconds(remaining);
			}
		}
	}

	function togglePause() {
		if (restPaused) {
			const newEndTime = Date.now() + pausedAtSeconds * 1000;
			setRestTimerEndTime(newEndTime);
			setRestPaused(false);
		} else {
			if (restIntervalRef.current) clearInterval(restIntervalRef.current);
			restIntervalRef.current = null;
			setPausedAtSeconds(restSeconds);
			setRestPaused(true);
		}
	}

	// ============================================================================
	// SESSION MANAGEMENT FUNCTIONS
	// ============================================================================

	function openSwapModal(exerciseIndex) {
		setSwapExerciseIndex(exerciseIndex);
		setSwapModalVisible(true);
	}

	function handleSwapExercise(alternative) {
		if (swapExerciseIndex === null) return;

		setSession((prev) => {
			if (!prev) return prev;

			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) => {
					if (i !== swapExerciseIndex) return ex;

					const originalName = ex.originalName || ex.name;

					return {
						...ex,
						name: alternative.name,
						originalName: originalName,
						isSwapped: true
					};
				})
			};

			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});

		setSwapModalVisible(false);
		setSwapExerciseIndex(null);
	}

	function toggleExpanded(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex ? { ...ex, expanded: !ex.expanded } : ex
				)
			};
			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function updateSetField(exerciseIndex, setIndex, patch) {
		setSession((prev) => {
			if (!prev) return prev;
			const next = { ...prev };
			next.exercises = prev.exercises.map((ex, i) => {
				if (i !== exerciseIndex) return ex;
				const sets = ex.sets.map((s) =>
					s.setIndex === setIndex ? { ...s, ...patch } : s
				);
				return { ...ex, sets };
			});
			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function addSet(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const exercise = prev.exercises[exerciseIndex];
			const newSetIndex = exercise.sets.length + 1;

			const exKey = normalizeExerciseKey(exercise.name);
			const defaultWeight =
				exerciseDefaults?.[exKey]?.defaultWeight != null
					? String(exerciseDefaults[exKey].defaultWeight)
					: '';

			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex
						? {
								...ex,
								sets: [
									...ex.sets,
									{
										setIndex: newSetIndex,
										weight: defaultWeight,
										reps: '',
										saved: false,
										savedAt: null
									}
								]
							}
						: ex
				)
			};

			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function removeSet(exerciseIndex, setIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const exercise = prev.exercises[exerciseIndex];

			if (exercise.sets.length <= 1) {
				Alert.alert('Cannot remove', 'Exercise must have at least one set.');
				return prev;
			}

			const setToRemove = exercise.sets.find((s) => s.setIndex === setIndex);
			if (setToRemove?.saved) {
				Alert.alert('Cannot remove', 'Cannot remove a saved set.');
				return prev;
			}

			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex
						? {
								...ex,
								sets: ex.sets
									.filter((s) => s.setIndex !== setIndex)
									.map((s, idx) => ({ ...s, setIndex: idx + 1 }))
							}
						: ex
				)
			};

			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function editSet(exerciseIndex, setIndex) {
		Alert.alert('Edit Set', 'Unlock this set to make changes?', [
			{
				text: 'Cancel',
				style: 'cancel'
			},
			{
				text: 'Unlock',
				onPress: () => {
					setSession((prev) => {
						if (!prev) return prev;
						const next = {
							...prev,
							exercises: prev.exercises.map((ex, i) =>
								i === exerciseIndex
									? {
											...ex,
											sets: ex.sets.map((s) =>
												s.setIndex === setIndex
													? { ...s, saved: false, savedAt: null }
													: s
											)
										}
									: ex
							)
						};

						if (user?.uid) firestoreUpsertSession(user.uid, next);
						return next;
					});
				}
			}
		]);
	}

	async function maybeSuggestProgressiveOverload({ exercise, set }) {
		if (!user?.uid) return;

		try {
			if (!exercise || !set) return;

			if (!isNumericTargetReps(exercise.targetReps)) return;

			const totalSets = exercise.sets?.length || 0;
			const isLastSet = totalSets > 0 && set.setIndex === totalSets;
			if (!isLastSet) return;

			const reps = Number(set.reps);
			const weight = Number(set.weight);
			const target = Number(exercise.targetReps);

			if (
				!Number.isFinite(reps) ||
				!Number.isFinite(weight) ||
				!Number.isFinite(target)
			)
				return;

			const hitTarget = reps >= target;
			if (!hitTarget) return;

			const nextWeight = weight + 5;
			const key = normalizeExerciseKey(exercise.name);

			const current = await loadExerciseDefaults(user.uid);
			const updated = {
				...current,
				[key]: {
					defaultWeight: nextWeight,
					updatedAt: new Date().toISOString(),
					reason: `Hit ${reps}/${target} on last set`
				}
			};

			await saveExerciseDefaults(user.uid, updated);
			setExerciseDefaults(updated);

			Alert.alert(
				'Progressive Overload',
				`Nice work! You hit ${reps} reps on your last set.\n\nNext time for ${exercise.name}, I'll prefill ${nextWeight} lbs (+5).`
			);
		} catch (e) {
			console.warn('Progressive overload save failed:', e);
		}
	}

	function getPreviousSet(exerciseName, setIndex) {
		const exerciseData = previousSessionData[exerciseName];
		if (!exerciseData) return null;

		const prevSet = exerciseData.find((s) => s.setIndex === setIndex);
		return prevSet || null;
	}

	function saveSet(exerciseIndex, setIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const ex = prev.exercises[exerciseIndex];
			const set = ex.sets.find((s) => s.setIndex === setIndex);
			if (!set) return prev;

			if (set.saved) {
				Alert.alert('Already saved', 'This set is already saved.');
				return prev;
			}

			const err = validateSetBeforeSave(ex, set);
			if (err) {
				Alert.alert('Missing info', err);
				return prev;
			}

			const next = { ...prev };
			next.exercises = prev.exercises.map((exercise, i) => {
				if (i !== exerciseIndex) return exercise;
				return {
					...exercise,
					sets: exercise.sets.map((s) =>
						s.setIndex === setIndex
							? { ...s, saved: true, savedAt: new Date().toISOString() }
							: s
					)
				};
			});

			if (user?.uid) firestoreUpsertSession(user.uid, next);

			const updatedExercise = next.exercises[exerciseIndex];
			const updatedSet = updatedExercise.sets.find(
				(s) => s.setIndex === setIndex
			);
			maybeSuggestProgressiveOverload({
				exercise: updatedExercise,
				set: updatedSet
			});

			const completed = isExerciseCompleted(updatedExercise);

			if (completed) {
				startRestTimer({
					seconds: 120,
					context: { type: 'exercise', exerciseName: updatedExercise.name }
				});
			} else {
				startRestTimer({
					seconds: 90,
					context: { type: 'set', exerciseName: updatedExercise.name, setIndex }
				});
			}

			return next;
		});
	}

	async function finishWorkout() {
		if (!session || !user?.uid) return;

		const hasAnySaved = session.exercises.some((ex) =>
			ex.sets.some((s) => s.saved)
		);

		if (!hasAnySaved) {
			Alert.alert('Nothing saved', 'Save at least one set before finishing.');
			return;
		}

		try {
			const result = await markSessionCompleted(user.uid, session.id);

			stopRestTimer();

			if (result?.weekAdvancement?.shouldAdvance) {
				Alert.alert('🎉 Week Complete!', result.weekAdvancement.message, [
					{
						text: 'Awesome!',
						onPress: () => router.back()
					}
				]);
			} else {
				Alert.alert('Workout saved', 'Session marked as completed.');
				router.back();
			}
		} catch (e) {
			console.warn(e);
			Alert.alert('Error', 'Could not finish the workout.');
		}
	}

	// ============================================================================
	// RENDER
	// ============================================================================

	if (loading || !session) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<Text style={styles.loadingText}>Loading session…</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				<SessionHeader
					session={session}
					currentWeek={currentWeek}
					today={today}
				/>

				<RestTimerModal
					visible={restVisible}
					restSeconds={restSeconds}
					restContext={restContext}
					restPaused={restPaused}
					progress={progress}
					onSkip={skipRest}
					onTogglePause={togglePause}
					onAddTime={addRest}
					onSubtractTime={subtractRest}
				/>

				<FlatList
					data={session.exercises}
					keyExtractor={(item, idx) => `${item.name}-${idx}`}
					contentContainerStyle={{ paddingBottom: 98 }}
					renderItem={({ item, index }) => (
						<ExerciseCard
							exercise={item}
							exerciseIndex={index}
							isCompleted={isExerciseCompleted(item)}
							onToggleExpanded={toggleExpanded}
							onOpenSwap={openSwapModal}
							updateSetField={updateSetField}
							saveSet={saveSet}
							removeSet={removeSet}
							editSet={editSet}
							addSet={addSet}
							normalizeNumberText={normalizeNumberText}
							getPreviousSet={getPreviousSet}
						/>
					)}
				/>

				<SwapExerciseModal
					visible={swapModalVisible}
					onClose={() => {
						setSwapModalVisible(false);
						setSwapExerciseIndex(null);
					}}
					exercise={
						swapExerciseIndex !== null
							? session.exercises[swapExerciseIndex]
							: null
					}
					templateId={template.id}
					onSwap={handleSwapExercise}
				/>

				<FinishWorkoutButton onFinish={finishWorkout} />
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, color: '#999999', fontFamily: FontFamily.black }
});
