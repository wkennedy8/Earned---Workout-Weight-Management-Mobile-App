// app/workout/details.jsx
// Workout Details Screen (read-only)
// Expects params: sessionId

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import {
	computeSessionStats,
	getSessionById
} from '@/controllers/sessionController';
import { formatDisplayDate, formatTime } from '@/utils/dateUtils';
import { formatDuration } from '@/utils/numberUtils';
import { tagColor } from '@/utils/workoutPlan';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Function #1: Build initial expanded state (auto-expand first exercise)
 */
function buildInitialExpanded(session) {
	const exs = Array.isArray(session?.exercises) ? session.exercises : [];
	const firstName = exs[0]?.name;
	return firstName ? { [firstName]: true } : {};
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkoutDetailsScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const params = useLocalSearchParams();
	const sessionId = params.sessionId ? String(params.sessionId) : null;

	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [expanded, setExpanded] = useState({}); // { [exerciseName]: bool }

	// Load session from Firebase
	useEffect(() => {
		let isMounted = true;

		(async () => {
			try {
				if (!sessionId) {
					Alert.alert('Missing session', 'No sessionId provided.');
					router.back();
					return;
				}

				if (!user?.uid) {
					setLoading(false);
					return;
				}

				const found = await getSessionById(user.uid, sessionId);

				if (!found) {
					Alert.alert('Not found', 'Could not find that workout session.');
					router.back();
					return;
				}

				if (!isMounted) return;

				setSession(found);
				setExpanded(buildInitialExpanded(found));
			} catch (e) {
				console.warn('Failed to load session:', e);
				Alert.alert('Error', 'Could not load workout details.');
				router.back();
			} finally {
				if (isMounted) setLoading(false);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [user?.uid, sessionId, router]);

	// Compute stats from session
	const stats = useMemo(
		() => (session ? computeSessionStats(session) : null),
		[session]
	);

	// Toggle exercise accordion
	function toggleExercise(name) {
		setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
	}

	// Navigate to edit screen
	function onEdit() {
		if (!session) return;
		router.push({
			pathname: '/workout/session',
			params: {
				mode: 'edit',
				sessionId: session.id,
				templateId: session.templateId
			}
		});
	}

	if (loading || !session) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<Text style={styles.loadingText}>Loading details…</Text>
				</View>
			</SafeAreaView>
		);
	}

	const exercises = Array.isArray(session.exercises) ? session.exercises : [];

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				{/* Top bar */}
				<View style={styles.topBar}>
					<TouchableOpacity
						onPress={() => router.back()}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Text style={styles.backChevron}>‹</Text>
					</TouchableOpacity>

					<Text style={styles.topTitle}>Workout Details</Text>

					<TouchableOpacity
						onPress={onEdit}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Text style={styles.editText}>Edit</Text>
					</TouchableOpacity>
				</View>

				{/* Header */}
				<View style={styles.headerCard}>
					<View style={styles.headerRow}>
						<View
							style={[
								styles.tagPill,
								{ backgroundColor: tagColor(session.tag) }
							]}
						>
							<Text style={styles.tagText}>{session.tag || 'Workout'}</Text>
						</View>
						<Text style={styles.headerTitle}>{session.title || 'Workout'}</Text>
					</View>

					<Text style={styles.dateText}>{formatDisplayDate(session.date)}</Text>

					<View style={styles.metaRow}>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Status</Text>
							<Text style={styles.metaValue}>
								{session.status === 'completed' ? 'Completed' : 'In progress'}
							</Text>
						</View>

						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Start</Text>
							<Text style={styles.metaValue}>
								{formatTime(session.startedAt)}
							</Text>
						</View>

						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>End</Text>
							<Text style={styles.metaValue}>
								{formatTime(session.completedAt)}
							</Text>
						</View>
					</View>
				</View>

				{/* Stats */}
				{stats ? (
					<View style={styles.statsCard}>
						<Text style={styles.sectionTitle}>Summary</Text>

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
							<Text style={styles.summaryLabel}>Duration</Text>
							<Text style={styles.summaryValue}>
								{formatDuration(stats.durationSeconds)}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Best Set</Text>
							<Text style={styles.summaryValue}>
								{stats.bestSet
									? `${stats.bestSet.exerciseName}: ${stats.bestSet.weight} × ${stats.bestSet.reps}`
									: '—'}
							</Text>
						</View>
					</View>
				) : null}

				{/* Exercises */}
				<FlatList
					data={exercises}
					keyExtractor={(item, idx) => `${item.name}-${idx}`}
					contentContainerStyle={{ paddingBottom: 20 }}
					renderItem={({ item }) => {
						const isExpanded = !!expanded[item.name];
						const isTime = String(item.targetReps).toLowerCase() === 'time';

						return (
							<View style={styles.exerciseCard}>
								<TouchableOpacity
									style={styles.exerciseHeader}
									activeOpacity={0.85}
									onPress={() => toggleExercise(item.name)}
								>
									<View style={{ flex: 1 }}>
										<Text style={styles.exerciseName}>{item.name}</Text>
										<Text style={styles.exerciseMeta}>
											{item.targetSets} sets, {item.targetReps}{' '}
											{isTime ? '' : 'reps'}
											{item.note ? ` • ${item.note}` : ''}
										</Text>
									</View>
									<Text style={styles.chevron}>{isExpanded ? '˅' : '›'}</Text>
								</TouchableOpacity>

								{isExpanded ? (
									<View style={{ marginTop: 10 }}>
										<View style={styles.tableHeader}>
											<Text style={[styles.th, { width: 44 }]}>Set</Text>
											<Text style={[styles.th, { flex: 1 }]}>Weight</Text>
											<Text style={[styles.th, { width: 110 }]}>
												{isTime ? 'Time (sec)' : 'Reps'}
											</Text>
											<Text
												style={[styles.th, { width: 80, textAlign: 'right' }]}
											>
												Saved
											</Text>
										</View>

										{(item.sets || []).map((s) => (
											<View
												key={`${item.name}-${s.setIndex}`}
												style={styles.tableRow}
											>
												<Text style={[styles.td, { width: 44 }]}>
													{s.setIndex}
												</Text>
												<Text style={[styles.td, { flex: 1 }]}>
													{String(s.weight || '—')}
												</Text>
												<Text style={[styles.td, { width: 110 }]}>
													{String(s.reps || '—')}
												</Text>
												<Text style={[styles.tdRight, { width: 80 }]}>
													{s.saved ? 'Yes' : '—'}
												</Text>
											</View>
										))}
									</View>
								) : null}
							</View>
						);
					}}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FFFFFF' },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },

	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },

	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},
	backChevron: {
		fontSize: 32,
		fontWeight: '900',
		color: '#1E66F5',
		marginTop: -6
	},
	topTitle: { fontSize: 18, fontWeight: '900', color: '#0B1220' },
	editText: { fontSize: 16, fontWeight: '900', color: '#1E66F5' },

	headerCard: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14,
		marginBottom: 12
	},
	headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
	headerTitle: { fontSize: 20, fontWeight: '900', color: '#0B1220' },
	dateText: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#6B7280' },

	metaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
	metaItem: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#EEF2F7',
		borderRadius: 14,
		padding: 10,
		backgroundColor: '#FAFBFF'
	},
	metaLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
	metaValue: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: '900',
		color: '#0B1220'
	},

	statsCard: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14,
		marginBottom: 12
	},
	sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },

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
	summaryLabel: { fontSize: 12, fontWeight: '900', color: '#6B7280' },
	summaryValue: {
		fontSize: 12,
		fontWeight: '900',
		color: '#111827',
		flex: 1,
		textAlign: 'right'
	},

	exerciseCard: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14,
		marginBottom: 12
	},
	exerciseHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	exerciseName: { fontSize: 16, fontWeight: '900', color: '#111827' },
	exerciseMeta: {
		marginTop: 4,
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280'
	},
	chevron: {
		fontSize: 22,
		fontWeight: '900',
		color: '#9CA3AF',
		marginLeft: 10
	},

	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 10,
		marginBottom: 8
	},
	th: { fontSize: 12, fontWeight: '900', color: '#6B7280' },

	tableRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 10
	},
	td: { fontSize: 13, fontWeight: '900', color: '#111827' },
	tdRight: {
		fontSize: 13,
		fontWeight: '900',
		color: '#6B7280',
		textAlign: 'right'
	}
});
