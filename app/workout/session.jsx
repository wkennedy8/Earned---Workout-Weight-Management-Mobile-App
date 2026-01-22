import { useAuth } from '@/context/AuthContext';
import {
	loadExerciseDefaults,
	saveExerciseDefaults
} from '@/controllers/exerciseDefaultsController';
import {
	buildEmptySession,
	upsertSession as firestoreUpsertSession,
	getInProgressSessionForDay,
	getSessionById,
	markSessionCompleted
} from '@/controllers/sessionController';
import { formatLocalDateKey, formatLongDate } from '@/utils/dateUtils';
import { PLAN } from '@/utils/workoutPlan';
import {
	normalizeExerciseKey,
	normalizeNumberText,
	tagColor
} from '@/utils/workoutUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import {
	GestureHandlerRootView,
	Swipeable
} from 'react-native-gesture-handler';
import { FontFamily } from '../../constants/fonts';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format seconds as M:SS timer display
 */
function formatTimer(seconds) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

// ============================================================================
// SWIPEABLE SET ROW COMPONENT
// ============================================================================

function SwipeableSetRow({
	item,
	set,
	exerciseIndex,
	setIndex,
	canRemove,
	updateSetField,
	saveSet,
	removeSet,
	normalizeNumberText
}) {
	const swipeableRef = useRef(null);

	const renderRightActions = (progress, dragX) => {
		return (
			<TouchableOpacity
				style={styles.deleteAction}
				onPress={() => {
					swipeableRef.current?.close();
					removeSet(exerciseIndex, set.setIndex);
				}}
				activeOpacity={0.9}
			>
				<Text style={styles.deleteActionText}>Delete</Text>
			</TouchableOpacity>
		);
	};

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={canRemove ? renderRightActions : null}
			rightThreshold={40}
			friction={2}
			overshootRight={false}
		>
			<View style={styles.tableRow}>
				<Text style={[styles.tdSet, { width: 44 }]}>{set.setIndex}</Text>

				<TextInput
					value={String(set.weight)}
					onChangeText={(t) =>
						updateSetField(exerciseIndex, set.setIndex, {
							weight: normalizeNumberText(t, { decimals: 1 })
						})
					}
					editable={!set.saved}
					placeholder={
						String(item.targetReps).toLowerCase() === 'time' ? '—' : '0'
					}
					placeholderTextColor='#9CA3AF'
					keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
					style={[
						styles.inputCell,
						{ flex: 1 },
						set.saved && styles.inputCellSaved
					]}
				/>

				<TextInput
					value={String(set.reps)}
					onChangeText={(t) =>
						updateSetField(exerciseIndex, set.setIndex, {
							reps: normalizeNumberText(t, { decimals: 0 })
						})
					}
					editable={!set.saved}
					placeholder='0'
					placeholderTextColor='#9CA3AF'
					keyboardType='numeric'
					style={[
						styles.inputCell,
						{ width: 110 },
						set.saved && styles.inputCellSaved
					]}
				/>

				<View style={{ width: 84 }}>
					{set.saved ? (
						<View style={styles.savedPill}>
							<Text style={styles.savedPillText}>Saved</Text>
						</View>
					) : (
						<TouchableOpacity
							style={styles.saveSetBtn}
							onPress={() => saveSet(exerciseIndex, set.setIndex)}
							activeOpacity={0.9}
						>
							<Text style={styles.saveSetBtnText}>Save</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Swipeable>
	);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkoutSessionScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const params = useLocalSearchParams();
	const templateId = String(params.templateId || 'push');

	const template = useMemo(() => PLAN[templateId] || PLAN.push, [templateId]);
	const today = useMemo(() => new Date(), []);
	const dateKey = useMemo(() => formatLocalDateKey(today), [today]);

	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [exerciseDefaults, setExerciseDefaults] = useState({});

	// Rest modal state
	const [restVisible, setRestVisible] = useState(false);
	const [restSeconds, setRestSeconds] = useState(0);
	const restIntervalRef = useRef(null);
	const [restContext, setRestContext] = useState(null);

	// ---- Init session (resume or create) with Firebase ----
	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				setLoading(true);
				const defaults = await loadExerciseDefaults(user.uid);
				setExerciseDefaults(defaults);

				const mode = String(params.mode || 'start');
				const sessionId = params.sessionId ? String(params.sessionId) : null;

				// ---------- EDIT MODE ----------
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
						exercises: found.exercises.map((ex, idx) => {
							const exKey = normalizeExerciseKey(ex.name);
							const defaultWeight =
								defaults?.[exKey]?.defaultWeight != null
									? String(defaults[exKey].defaultWeight)
									: '';

							return {
								expanded: idx === 0,
								...ex,
								sets: (ex.sets || []).map((s) => ({
									saved: s.saved ?? false,
									savedAt: s.savedAt ?? null,
									...s,
									weight:
										!s?.saved &&
										!String(s?.weight || '').trim() &&
										defaultWeight
											? defaultWeight
											: s.weight
								}))
							};
						})
					};

					setSession(normalized);
					await firestoreUpsertSession(user.uid, normalized);
					return;
				}

				// ---------- RESUME MODE ----------
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

				// ---------- START / FALLBACK ----------
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

				// ---------- CREATE NEW ----------
				const created = buildEmptySession({
					template,
					defaultsMap: defaults
				});
				created.exercises[0].expanded = true;

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
	}, [user?.uid, templateId, params.mode, params.sessionId]);

	// Rest timer functions
	function startRestTimer({ seconds, context }) {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current);

		setRestContext(context);
		setRestSeconds(seconds);
		setRestVisible(true);

		restIntervalRef.current = setInterval(() => {
			setRestSeconds((prev) => {
				if (prev <= 1) {
					if (restIntervalRef.current) clearInterval(restIntervalRef.current);
					restIntervalRef.current = null;
					setTimeout(() => setRestVisible(false), 350);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}

	function skipRest() {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		restIntervalRef.current = null;
		setRestSeconds(0);
		setRestVisible(false);
	}

	function addRest(secondsToAdd) {
		setRestSeconds((prev) => prev + secondsToAdd);
	}

	// Exercise accordion and set management
	function toggleExpanded(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex ? { ...ex, expanded: !ex.expanded } : ex
				)
			};
			// Save to Firebase
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
			// Save to Firebase
			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function isExerciseCompleted(ex) {
		return ex.sets.length > 0 && ex.sets.every((s) => s.saved === true);
	}

	// Add/remove sets
	function addSet(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const exercise = prev.exercises[exerciseIndex];
			const newSetIndex = exercise.sets.length + 1;

			// Get default weight for this exercise
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

			// Save to Firebase
			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	function removeSet(exerciseIndex, setIndex) {
		setSession((prev) => {
			if (!prev) return prev;
			const exercise = prev.exercises[exerciseIndex];

			// Don't allow removing if only 1 set left
			if (exercise.sets.length <= 1) {
				Alert.alert('Cannot remove', 'Exercise must have at least one set.');
				return prev;
			}

			// Don't allow removing saved sets
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
									.map((s, idx) => ({ ...s, setIndex: idx + 1 })) // Re-index
							}
						: ex
				)
			};

			// Save to Firebase
			if (user?.uid) firestoreUpsertSession(user.uid, next);
			return next;
		});
	}

	// Set validation and save logic
	function validateSetBeforeSave(exercise, set) {
		const isTime = String(exercise.targetReps).toLowerCase() === 'time';
		const isAmrap = String(exercise.targetReps).toLowerCase() === 'amrap';

		const requiresWeight = !(isTime || isAmrap);

		if (requiresWeight && !String(set.weight).trim()) return 'Enter a weight.';
		if (!String(set.reps).trim())
			return isTime ? 'Enter seconds.' : 'Enter reps.';

		if (requiresWeight && !Number.isFinite(Number(set.weight)))
			return 'Weight must be a number.';
		if (!Number.isFinite(Number(set.reps)))
			return isTime ? 'Seconds must be a number.' : 'Reps must be a number.';

		return null;
	}

	function isNumericTargetReps(targetReps) {
		const t = String(targetReps || '')
			.trim()
			.toLowerCase();
		if (t === 'amrap' || t === 'time') return false;
		return Number.isFinite(Number(t));
	}

	async function maybeSuggestProgressiveOverload({ exercise, set }) {
		if (!user?.uid) return;

		try {
			if (!exercise || !set) return;

			// Skip non-numeric templates (AMRAP/time)
			if (!isNumericTargetReps(exercise.targetReps)) return;

			// Only evaluate LAST set
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

			// Check if hit target reps
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

			// Persist to Firebase
			if (user?.uid) firestoreUpsertSession(user.uid, next);

			// Progressive overload check (async, non-blocking)
			const updatedExercise = next.exercises[exerciseIndex];
			const updatedSet = updatedExercise.sets.find(
				(s) => s.setIndex === setIndex
			);
			maybeSuggestProgressiveOverload({
				exercise: updatedExercise,
				set: updatedSet
			});

			// Decide which timer to show
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

	// Finish workout
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
			await markSessionCompleted(user.uid, session.id);
			Alert.alert('Workout saved', 'Session marked as completed.');
			router.back();
		} catch (e) {
			console.warn(e);
			Alert.alert('Error', 'Could not finish the workout.');
		}
	}

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
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={styles.safe}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.container}
				>
					{/* Custom top bar */}
					<View style={styles.topBar}>
						<TouchableOpacity
							onPress={() => router.back()}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Text style={styles.backChevron}>‹</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() =>
								Alert.alert('Settings', 'Settings screen not wired yet.')
							}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Text style={styles.settingsIcon}>⚙️</Text>
						</TouchableOpacity>
					</View>

					{/* Header */}
					<View style={styles.header}>
						<View style={styles.headerRow}>
							<View
								style={[
									styles.tagPill,
									{ backgroundColor: tagColor(session.tag) }
								]}
							>
								<Text style={styles.tagText}>{session.tag}</Text>
							</View>
							<Text style={styles.headerTitle}>{session.title}</Text>
						</View>
						<Text style={styles.dateText}>{formatLongDate(today)}</Text>
					</View>

					{/* Rest Timer Modal */}
					<Modal
						visible={restVisible}
						transparent
						animationType='fade'
						onRequestClose={skipRest}
					>
						<View style={styles.modalBackdrop}>
							<View style={styles.modalCard}>
								<Text style={styles.modalTitle}>Rest</Text>
								<Text style={styles.modalTimer}>
									{formatTimer(restSeconds)}
								</Text>

								<Text style={styles.modalContext}>
									{restContext?.type === 'exercise'
										? `Exercise completed: ${restContext.exerciseName}`
										: restContext?.type === 'set'
											? `Set saved: ${restContext.exerciseName} (Set ${restContext.setIndex})`
											: ''}
								</Text>

								<View style={styles.modalActionsRow}>
									<TouchableOpacity
										style={styles.modalSecondaryBtn}
										onPress={() => addRest(30)}
										activeOpacity={0.9}
									>
										<Text style={styles.modalSecondaryText}>+30s</Text>
									</TouchableOpacity>

									<TouchableOpacity
										style={styles.modalSecondaryBtn}
										onPress={skipRest}
										activeOpacity={0.9}
									>
										<Text style={styles.modalSecondaryText}>Skip</Text>
									</TouchableOpacity>
								</View>

								<TouchableOpacity
									style={styles.modalPrimaryBtn}
									onPress={skipRest}
									activeOpacity={0.9}
								>
									<Text style={styles.modalPrimaryText}>Close</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>

					{/* Exercise List */}
					<FlatList
						data={session.exercises}
						keyExtractor={(item, idx) => `${item.name}-${idx}`}
						contentContainerStyle={{ paddingBottom: 98 }}
						renderItem={({ item, index }) => {
							const completed = isExerciseCompleted(item);
							return (
								<View style={styles.exerciseCard}>
									<TouchableOpacity
										activeOpacity={0.85}
										onPress={() => toggleExpanded(index)}
										style={styles.accordionHeader}
									>
										<View style={styles.exerciseHeaderLeft}>
											<View style={styles.exerciseIcon}>
												<Text style={styles.exerciseIconText}>🏋️</Text>
											</View>
											<View style={{ flex: 1 }}>
												<Text style={styles.exerciseName}>{item.name}</Text>
												<Text style={styles.exerciseMeta}>
													{item.targetSets} sets, {item.targetReps}{' '}
													{String(item.targetReps).toLowerCase() === 'time'
														? ''
														: 'reps'}
													{item.note ? ` • ${item.note}` : ''}
												</Text>

												<Text
													style={[
														styles.exerciseStatus,
														completed && styles.exerciseStatusDone
													]}
												>
													{completed ? 'Completed' : 'In progress'}
												</Text>
											</View>
										</View>

										<Text style={styles.chevron}>
											{item.expanded ? '˅' : '›'}
										</Text>
									</TouchableOpacity>

									{item.expanded ? (
										<View style={{ marginTop: 10 }}>
											<View style={styles.tableHeader}>
												<Text style={[styles.th, { width: 44 }]}>Set</Text>
												<Text style={[styles.th, { flex: 1 }]}>
													Weight (lbs)
												</Text>
												<Text style={[styles.th, { width: 110 }]}>
													{String(item.targetReps).toLowerCase() === 'time'
														? 'Time (sec)'
														: 'Reps'}
												</Text>
												<Text
													style={[styles.th, { width: 84, textAlign: 'right' }]}
												>
													Action
												</Text>
											</View>

											{item.sets.map((s) => (
												<SwipeableSetRow
													key={`${item.name}-${s.setIndex}`}
													item={item}
													set={s}
													exerciseIndex={index}
													setIndex={s.setIndex}
													canRemove={!s.saved && item.sets.length > 1}
													updateSetField={updateSetField}
													saveSet={saveSet}
													removeSet={removeSet}
													normalizeNumberText={normalizeNumberText}
												/>
											))}

											{/* Add Set Button */}
											<TouchableOpacity
												style={styles.addSetButton}
												onPress={() => addSet(index)}
												activeOpacity={0.9}
											>
												<Text style={styles.addSetButtonText}>+ Add Set</Text>
											</TouchableOpacity>
										</View>
									) : null}
								</View>
							);
						}}
					/>

					{/* Bottom CTA */}
					<View style={styles.bottomCta}>
						<TouchableOpacity
							style={styles.finishButton}
							onPress={finishWorkout}
							activeOpacity={0.9}
						>
							<Text style={styles.finishButtonText}>Finish Workout</Text>
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },

	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, color: '#999999', fontFamily: FontFamily.black },

	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},
	backChevron: {
		fontSize: 32,
		fontWeight: '900',
		color: '#AFFF2B',
		marginTop: -6
	},
	topTitle: { fontSize: 18, fontFamily: FontFamily.black, color: '#FFFFFF' },
	settingsIcon: { fontSize: 20, color: '#999999' },

	header: { marginBottom: 12 },
	headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
	headerTitle: { fontSize: 22, fontFamily: FontFamily.black, color: '#FFFFFF' },
	dateText: {
		marginTop: 6,
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#999999'
	},

	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.85)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 18
	},
	modalCard: {
		width: '100%',
		borderRadius: 18,
		backgroundColor: '#1A1A1A',
		padding: 18,
		borderWidth: 1,
		borderColor: '#333333'
	},
	modalTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		textAlign: 'center'
	},
	modalTimer: {
		marginTop: 10,
		fontSize: 44,
		fontWeight: '900',
		color: '#AFFF2B',
		textAlign: 'center'
	},
	modalContext: {
		marginTop: 10,
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center'
	},
	modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
	modalSecondaryBtn: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalSecondaryText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	modalPrimaryBtn: {
		marginTop: 10,
		height: 50,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalPrimaryText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#000000'
	},

	exerciseCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},

	accordionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	exerciseHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	exerciseIcon: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseIconText: { fontSize: 16 },
	exerciseName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	exerciseMeta: {
		fontSize: 12,
		color: '#999999',
		marginTop: 2
	},
	exerciseStatus: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: '900',
		color: '#FFD60A'
	},
	exerciseStatusDone: { color: '#AFFF2B' },
	chevron: {
		fontSize: 22,
		fontWeight: '900',
		color: '#666666',
		marginLeft: 10
	},

	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#0D0D0D',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 10,
		marginBottom: 8
	},
	th: { fontSize: 12, fontWeight: '900', color: '#999999' },

	tableRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 8,
		backgroundColor: '#1A1A1A'
	},
	tdSet: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		textAlign: 'center'
	},

	inputCell: {
		height: 44,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 12,
		fontSize: 14,
		fontFamily: FontFamily.black,
		fontWeight: '800',
		color: '#FFFFFF',
		backgroundColor: '#0D0D0D'
	},
	inputCellSaved: { backgroundColor: '#F3F4F6', color: '#999999' },

	saveSetBtn: {
		height: 44,
		borderRadius: 12,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveSetBtnText: {
		color: '#000000',
		fontSize: 13,
		fontFamily: FontFamily.black
	},

	savedPill: {
		height: 44,
		borderRadius: 12,
		backgroundColor: '#1A3A1F',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#2D5F34'
	},
	savedPillText: {
		color: '#AFFF2B',
		fontSize: 13,
		fontFamily: FontFamily.black
	},

	deleteAction: {
		backgroundColor: '#FF453A',
		justifyContent: 'center',
		alignItems: 'flex-end',
		paddingHorizontal: 20,
		marginBottom: 8,
		borderTopRightRadius: 12,
		borderBottomRightRadius: 12,
		marginLeft: 10
	},
	deleteActionText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontFamily: FontFamily.black,
		fontWeight: '900'
	},

	addSetButton: {
		marginTop: 8,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#333333'
	},
	addSetButtonText: {
		color: '#AFFF2B',
		fontSize: 14,
		fontFamily: FontFamily.black
	},

	bottomCta: { position: 'absolute', left: 18, right: 18, bottom: 12 },
	finishButton: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 2
	},
	finishButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.black
	}
});
