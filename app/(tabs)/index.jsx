// import { useEffect, useMemo, useState } from 'react';
// import {
// 	Alert,
// 	FlatList,
// 	KeyboardAvoidingView,
// 	Modal,
// 	Platform,
// 	StyleSheet,
// 	Text,
// 	TextInput,
// 	TouchableOpacity,
// 	View
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { useProfile } from '@/hooks/useProfile';
// import { useWeightEntries } from '@/hooks/useWeightEntries';

// import {
// 	formatDisplayDate,
// 	getFirstEntry,
// 	getLatestEntry,
// 	getTimeBasedGreeting,
// 	isValidWeightNumber,
// 	normalizeWeightInput,
// 	shouldSuggestMacroCut,
// 	toFixed1
// } from '@/utils/weightUtils';

// export default function HomeScreen() {
// 	const greeting = useMemo(() => getTimeBasedGreeting('Will'), []);
// 	const [weightText, setWeightText] = useState('');

// 	// Hooks
// 	const { entries, todayKey, getEntryForDate, upsertEntry } =
// 		useWeightEntries();
// 	const { profile, calories, reduceCarbs } = useProfile();

// 	// Stall modal state
// 	const [macroModalVisible, setMacroModalVisible] = useState(false);
// 	const [macroModalData, setMacroModalData] = useState(null);

// 	// Prefill today’s weight once entries load/update
// 	useEffect(() => {
// 		const today = getEntryForDate(todayKey);
// 		if (today) setWeightText(String(today.weight));
// 	}, [todayKey, getEntryForDate]);

// 	const weightDelta = useMemo(() => {
// 		const first = getFirstEntry(entries);
// 		const latest = getLatestEntry(entries);

// 		if (!first || !latest)
// 			return { hasData: false, delta: 0, status: 'neutral' };

// 		const rawDelta = Number(latest.weight) - Number(first.weight);
// 		const delta = Math.round(rawDelta * 10) / 10;

// 		let status = 'neutral';
// 		if (delta > 0) status = 'gain';
// 		else if (delta < 0) status = 'loss';

// 		return { hasData: true, delta, status, first, latest };
// 	}, [entries]);

// 	async function applyCarbReduction() {
// 		try {
// 			await reduceCarbs(15);
// 			setMacroModalVisible(false);
// 			setMacroModalData(null);
// 			Alert.alert('Updated', 'Carbs lowered by 15g.');
// 		} catch (e) {
// 			console.warn('Failed to apply carb reduction:', e);
// 			Alert.alert('Error', 'Could not update macros. Please try again.');
// 		}
// 	}

// 	async function onSave() {
// 		const trimmed = String(weightText || '').trim();
// 		if (!isValidWeightNumber(trimmed)) {
// 			Alert.alert('Invalid weight', 'Enter a valid weight (e.g., 198.6).');
// 			return;
// 		}

// 		const weight = Number(trimmed);

// 		try {
// 			const nextEntries = await upsertEntry({ dateKey: todayKey, weight });
// 			Alert.alert('Saved', "Today's weight has been saved.");

// 			// Stall rule check after save
// 			const check = shouldSuggestMacroCut(nextEntries);
// 			if (check.eligible && check.stalled) {
// 				setMacroModalData(check);
// 				setMacroModalVisible(true);
// 			}
// 		} catch (e) {
// 			Alert.alert('Error', 'Could not save your weight. Please try again.');
// 		}
// 	}

// 	const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);

// 	return (
// 		<SafeAreaView style={styles.safe}>
// 			<KeyboardAvoidingView
// 				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
// 				style={styles.container}
// 			>
// 				{/* Stall Modal */}
// 				<Modal
// 					visible={macroModalVisible}
// 					transparent
// 					animationType='fade'
// 					onRequestClose={() => setMacroModalVisible(false)}
// 				>
// 					<View style={styles.modalBackdrop}>
// 						<View style={styles.modalCard}>
// 							<Text style={styles.modalTitle}>Progress Check</Text>

// 							<Text style={styles.modalBody}>
// 								Your average weight change over the last 7 days is under 0.5
// 								lbs. Lower your carbs by 15g to restart progress.
// 							</Text>

// 							{macroModalData?.eligible ? (
// 								<Text style={styles.modalSubtle}>
// 									Prev 7-day avg: {toFixed1(macroModalData.prev7Avg)} • Last
// 									7-day avg: {toFixed1(macroModalData.last7Avg)} • Weekly
// 									change: {toFixed1(macroModalData.weeklyLoss)} lbs
// 								</Text>
// 							) : null}

// 							<View style={styles.modalActionsRow}>
// 								<TouchableOpacity
// 									style={styles.modalSecondaryBtn}
// 									onPress={() => setMacroModalVisible(false)}
// 									activeOpacity={0.9}
// 								>
// 									<Text style={styles.modalSecondaryText}>Not Now</Text>
// 								</TouchableOpacity>

// 								<TouchableOpacity
// 									style={styles.modalPrimaryBtn}
// 									onPress={applyCarbReduction}
// 									activeOpacity={0.9}
// 								>
// 									<Text style={styles.modalPrimaryText}>Apply -15g Carbs</Text>
// 								</TouchableOpacity>
// 							</View>
// 						</View>
// 					</View>
// 				</Modal>

// 				{/* Header */}
// 				<View style={styles.headerRow}>
// 					<View style={styles.headerLeft}>
// 						<View style={styles.iconBadge}>
// 							<Text style={styles.iconText}>⚖️</Text>
// 						</View>
// 						<Text style={styles.title}>{greeting}</Text>
// 					</View>

// 					<TouchableOpacity
// 						onPress={() =>
// 							Alert.alert('Settings', 'Settings screen not wired yet.')
// 						}
// 						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
// 					>
// 						<Text style={styles.settingsIcon}>⚙️</Text>
// 					</TouchableOpacity>
// 				</View>

// 				{/* Calories & Macros */}
// 				<View style={styles.macrosCard}>
// 					<View style={styles.macrosHeader}>
// 						<Text style={styles.macrosTitle}>Calories & Macros</Text>
// 						<View style={styles.caloriePill}>
// 							<Text style={styles.caloriePillText}>
// 								{Math.round(calories)} cal
// 							</Text>
// 						</View>
// 					</View>

// 					<View style={styles.macroRow}>
// 						<View style={styles.macroChip}>
// 							<Text style={styles.macroChipLabel}>Protein</Text>
// 							<Text style={styles.macroChipValue}>{profile.protein}g</Text>
// 						</View>
// 						<View style={styles.macroChip}>
// 							<Text style={styles.macroChipLabel}>Carbs</Text>
// 							<Text style={styles.macroChipValue}>{profile.carbs}g</Text>
// 						</View>
// 						<View style={styles.macroChip}>
// 							<Text style={styles.macroChipLabel}>Fats</Text>
// 							<Text style={styles.macroChipValue}>{profile.fats}g</Text>
// 						</View>
// 					</View>
// 				</View>

// 				{/* Today’s Weight */}
// 				<View style={styles.section}>
// 					<Text style={styles.sectionTitle}>Today’s Weight</Text>

// 					<View style={styles.inputRow}>
// 						<TextInput
// 							value={weightText}
// 							onChangeText={(t) => setWeightText(normalizeWeightInput(t))}
// 							placeholder='Enter your weight…'
// 							placeholderTextColor='#8A94A6'
// 							keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
// 							style={styles.input}
// 							maxLength={6}
// 							returnKeyType='done'
// 						/>
// 						<View style={styles.lbsPill}>
// 							<Text style={styles.lbsText}>lbs</Text>
// 						</View>
// 					</View>

// 					<TouchableOpacity
// 						style={styles.saveButton}
// 						onPress={onSave}
// 						activeOpacity={0.85}
// 					>
// 						<Text style={styles.saveButtonText}>Save</Text>
// 					</TouchableOpacity>
// 				</View>

// 				{/* Weight change */}
// 				<View style={styles.trackerCard}>
// 					<Text style={styles.trackerTitle}>Total Weight Change</Text>

// 					{!weightDelta.hasData ? (
// 						<Text style={styles.trackerSubtle}>
// 							Add at least two entries to see your progress.
// 						</Text>
// 					) : (
// 						<>
// 							<Text
// 								style={[
// 									styles.trackerValue,
// 									weightDelta.status === 'gain' && styles.trackerValueRed,
// 									weightDelta.status === 'loss' && styles.trackerValueGreen,
// 									weightDelta.status === 'neutral' && styles.trackerValueYellow
// 								]}
// 							>
// 								{weightDelta.delta > 0 && '+'}
// 								{weightDelta.delta < 0 && '-'}
// 								{toFixed1(Math.abs(weightDelta.delta))} lbs
// 							</Text>

// 							<Text style={styles.trackerSubtle}>
// 								From {formatDisplayDate(weightDelta.first.date)} (
// 								{toFixed1(weightDelta.first.weight)} lbs) to{' '}
// 								{formatDisplayDate(weightDelta.latest.date)} (
// 								{toFixed1(weightDelta.latest.weight)} lbs)
// 							</Text>
// 						</>
// 					)}
// 				</View>

// 				<View style={styles.divider} />

// 				{/* History */}
// 				<View style={styles.section}>
// 					<View style={styles.historyHeaderRow}>
// 						<Text style={styles.sectionTitle}>Weight History</Text>
// 						<Text style={styles.subtle}>
// 							{entries.length ? `${entries.length} entries` : 'No entries yet'}
// 						</Text>
// 					</View>

// 					<View style={styles.card}>
// 						<FlatList
// 							data={recentEntries}
// 							keyExtractor={(item) => item.date}
// 							ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
// 							renderItem={({ item }) => (
// 								<View style={styles.historyRow}>
// 									<Text style={styles.historyDate}>
// 										{formatDisplayDate(item.date)}
// 									</Text>
// 									<Text style={styles.historyWeight}>
// 										{Number(item.weight).toFixed(1)} lbs
// 									</Text>
// 								</View>
// 							)}
// 							ListEmptyComponent={
// 								<View style={styles.emptyState}>
// 									<Text style={styles.emptyTitle}>No history yet</Text>
// 									<Text style={styles.emptyBody}>
// 										Add today’s weight to start tracking your progress.
// 									</Text>
// 								</View>
// 							}
// 						/>
// 					</View>

// 					<TouchableOpacity
// 						style={styles.viewMoreButton}
// 						onPress={() =>
// 							Alert.alert('History', 'Full history screen not wired yet.')
// 						}
// 						activeOpacity={0.85}
// 					>
// 						<Text style={styles.viewMoreText}>View More</Text>
// 						<Text style={styles.viewMoreChevron}>›</Text>
// 					</TouchableOpacity>
// 				</View>
// 			</KeyboardAvoidingView>
// 		</SafeAreaView>
// 	);
// }

// const styles = StyleSheet.create({
// 	safe: { flex: 1, backgroundColor: '#FFFFFF' },
// 	container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

// 	headerRow: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		justifyContent: 'space-between',
// 		marginBottom: 14
// 	},
// 	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
// 	iconBadge: {
// 		width: 40,
// 		height: 40,
// 		borderRadius: 12,
// 		backgroundColor: '#EFF4FF',
// 		alignItems: 'center',
// 		justifyContent: 'center'
// 	},
// 	iconText: { fontSize: 18 },
// 	title: { fontSize: 26, fontWeight: '800', color: '#0B1220' },
// 	settingsIcon: { fontSize: 20, color: '#6B7280' },

// 	macrosCard: {
// 		borderWidth: 1,
// 		borderColor: '#E7EDF6',
// 		borderRadius: 16,
// 		backgroundColor: '#FFFFFF',
// 		padding: 14,
// 		marginBottom: 12
// 	},
// 	macrosHeader: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		justifyContent: 'space-between'
// 	},
// 	macrosTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
// 	caloriePill: {
// 		paddingHorizontal: 10,
// 		paddingVertical: 6,
// 		borderRadius: 999,
// 		backgroundColor: '#F3F4F6'
// 	},
// 	caloriePillText: { fontSize: 12, fontWeight: '900', color: '#111827' },
// 	macroRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
// 	macroChip: {
// 		flex: 1,
// 		borderWidth: 1,
// 		borderColor: '#EEF2F7',
// 		borderRadius: 14,
// 		padding: 10,
// 		backgroundColor: '#FAFBFF'
// 	},
// 	macroChipLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
// 	macroChipValue: {
// 		marginTop: 6,
// 		fontSize: 16,
// 		fontWeight: '900',
// 		color: '#0B1220'
// 	},

// 	section: { marginTop: 6 },
// 	sectionTitle: {
// 		fontSize: 18,
// 		fontWeight: '800',
// 		color: '#0B1220',
// 		marginBottom: 10
// 	},

// 	inputRow: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		borderWidth: 1,
// 		borderColor: '#D9E1EE',
// 		borderRadius: 14,
// 		paddingHorizontal: 14,
// 		height: 54,
// 		backgroundColor: '#FFFFFF'
// 	},
// 	input: { flex: 1, fontSize: 18, color: '#0B1220' },
// 	lbsPill: {
// 		paddingHorizontal: 10,
// 		paddingVertical: 6,
// 		borderRadius: 999,
// 		backgroundColor: '#F3F4F6'
// 	},
// 	lbsText: { fontSize: 12, fontWeight: '700', color: '#374151' },

// 	saveButton: {
// 		marginTop: 12,
// 		height: 52,
// 		borderRadius: 14,
// 		backgroundColor: '#1E66F5',
// 		alignItems: 'center',
// 		justifyContent: 'center',
// 		shadowColor: '#000',
// 		shadowOpacity: 0.08,
// 		shadowRadius: 10,
// 		shadowOffset: { width: 0, height: 6 },
// 		elevation: 2
// 	},
// 	saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

// 	divider: { height: 1, backgroundColor: '#EEF2F7', marginVertical: 18 },

// 	historyHeaderRow: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		justifyContent: 'space-between',
// 		marginBottom: 10
// 	},
// 	subtle: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

// 	card: {
// 		borderWidth: 1,
// 		borderColor: '#E7EDF6',
// 		borderRadius: 16,
// 		backgroundColor: '#FFFFFF',
// 		overflow: 'hidden'
// 	},
// 	historyRow: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		justifyContent: 'space-between',
// 		paddingHorizontal: 14,
// 		paddingVertical: 14
// 	},
// 	historyDate: { fontSize: 16, color: '#111827', fontWeight: '700' },
// 	historyWeight: { fontSize: 18, color: '#0B1220', fontWeight: '800' },
// 	rowDivider: { height: 1, backgroundColor: '#EEF2F7' },

// 	emptyState: { paddingHorizontal: 14, paddingVertical: 18 },
// 	emptyTitle: {
// 		fontSize: 16,
// 		fontWeight: '800',
// 		color: '#0B1220',
// 		marginBottom: 4
// 	},
// 	emptyBody: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

// 	viewMoreButton: {
// 		marginTop: 12,
// 		alignSelf: 'center',
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		gap: 6,
// 		borderRadius: 999,
// 		backgroundColor: '#F3F4F6',
// 		paddingHorizontal: 16,
// 		paddingVertical: 10
// 	},
// 	viewMoreText: { fontSize: 14, fontWeight: '800', color: '#1E66F5' },
// 	viewMoreChevron: {
// 		fontSize: 18,
// 		fontWeight: '900',
// 		color: '#1E66F5',
// 		marginTop: -1
// 	},

// 	trackerCard: {
// 		marginTop: 14,
// 		borderWidth: 1,
// 		borderColor: '#E7EDF6',
// 		borderRadius: 16,
// 		backgroundColor: '#FFFFFF',
// 		padding: 14
// 	},
// 	trackerTitle: {
// 		fontSize: 14,
// 		fontWeight: '900',
// 		color: '#0B1220',
// 		marginBottom: 8
// 	},
// 	trackerValue: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
// 	trackerValueGreen: { color: '#10B981' },
// 	trackerValueRed: { color: '#EF4444' },
// 	trackerValueYellow: { color: '#F59E0B' },
// 	trackerSubtle: {
// 		fontSize: 12,
// 		fontWeight: '700',
// 		color: '#6B7280',
// 		lineHeight: 18
// 	},

// 	modalBackdrop: {
// 		flex: 1,
// 		backgroundColor: 'rgba(0,0,0,0.35)',
// 		alignItems: 'center',
// 		justifyContent: 'center',
// 		padding: 18
// 	},
// 	modalCard: {
// 		width: '100%',
// 		borderRadius: 18,
// 		backgroundColor: '#FFFFFF',
// 		padding: 18,
// 		borderWidth: 1,
// 		borderColor: '#E7EDF6'
// 	},
// 	modalTitle: {
// 		fontSize: 18,
// 		fontWeight: '900',
// 		color: '#0B1220',
// 		textAlign: 'center'
// 	},
// 	modalBody: {
// 		marginTop: 10,
// 		fontSize: 13,
// 		fontWeight: '700',
// 		color: '#111827',
// 		textAlign: 'center',
// 		lineHeight: 18
// 	},
// 	modalSubtle: {
// 		marginTop: 10,
// 		fontSize: 12,
// 		fontWeight: '700',
// 		color: '#6B7280',
// 		textAlign: 'center'
// 	},
// 	modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
// 	modalSecondaryBtn: {
// 		flex: 1,
// 		height: 48,
// 		borderRadius: 14,
// 		backgroundColor: '#F3F4F6',
// 		alignItems: 'center',
// 		justifyContent: 'center'
// 	},
// 	modalSecondaryText: { fontSize: 14, fontWeight: '900', color: '#111827' },
// 	modalPrimaryBtn: {
// 		flex: 1,
// 		height: 48,
// 		borderRadius: 14,
// 		backgroundColor: '#1E66F5',
// 		alignItems: 'center',
// 		justifyContent: 'center'
// 	},
// 	modalPrimaryText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' }
// });

import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/hooks/useProfile';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { formatDisplayDate } from '../../utils/dateUtils';
import {
	isValidWeightNumber,
	normalizeWeightInput,
	toFixed1
} from '../../utils/numberUtils';
import { getTimeBasedGreeting } from '../../utils/weightUtils';

// TODO: Add remaining functions
function getFirstEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[entries.length - 1]; // Last item = oldest (sorted newest-first)
}

function getLatestEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[0]; // First item = newest
}

function shouldSuggestMacroCut(entries) {
	// Need at least 14 days of data
	if (!Array.isArray(entries) || entries.length < 14) {
		return { eligible: false, stalled: false };
	}

	// Get last 14 entries (sorted newest-first)
	const last14 = entries.slice(0, 14);

	// Split into two weeks
	const last7 = last14.slice(0, 7); // Days 1-7 (most recent)
	const prev7 = last14.slice(7, 14); // Days 8-14 (previous week)

	// Calculate averages
	const last7Avg = last7.reduce((sum, e) => sum + Number(e.weight), 0) / 7;
	const prev7Avg = prev7.reduce((sum, e) => sum + Number(e.weight), 0) / 7;

	// Calculate weekly change (negative = weight loss)
	const weeklyLoss = prev7Avg - last7Avg;

	// Stalled if less than 0.5 lbs loss per week
	const stalled = weeklyLoss < 0.5;

	return {
		eligible: true,
		stalled,
		last7Avg,
		prev7Avg,
		weeklyLoss
	};
}

export default function HomeScreen() {
	const greeting = useMemo(() => getTimeBasedGreeting('Will'), []);
	const [weightText, setWeightText] = useState('');

	// Hooks
	const { entries, todayKey, getEntryForDate, upsertEntry } =
		useWeightEntries();
	const { profile, calories, reduceCarbs } = useProfile();

	// Stall modal state
	const [macroModalVisible, setMacroModalVisible] = useState(false);
	const [macroModalData, setMacroModalData] = useState(null);

	// Prefill today's weight once entries load/update
	useEffect(() => {
		const today = getEntryForDate(todayKey);
		if (today) setWeightText(String(today.weight));
	}, [todayKey, getEntryForDate]);

	// Save today's weight
	async function onSave() {
		const trimmed = String(weightText || '').trim();
		if (!isValidWeightNumber(trimmed)) {
			Alert.alert('Invalid weight', 'Enter a valid weight (e.g., 198.6).');
			return;
		}

		const weight = Number(trimmed);

		try {
			const nextEntries = await upsertEntry({ dateKey: todayKey, weight });
			Alert.alert('Saved', "Today's weight has been saved.");

			// Stall rule check after save
			const check = shouldSuggestMacroCut(nextEntries);
			if (check.eligible && check.stalled) {
				setMacroModalData(check);
				setMacroModalVisible(true);
			}
		} catch (e) {
			Alert.alert('Error', 'Could not save your weight. Please try again.');
		}
	}

	// Apply carb reduction from modal
	async function applyCarbReduction() {
		try {
			await reduceCarbs(15);
			setMacroModalVisible(false);
			setMacroModalData(null);
			Alert.alert('Updated', 'Carbs lowered by 15g.');
		} catch (e) {
			console.warn('Failed to apply carb reduction:', e);
			Alert.alert('Error', 'Could not update macros. Please try again.');
		}
	}

	// Calculate total weight change from first to latest entry
	const weightDelta = useMemo(() => {
		const first = getFirstEntry(entries);
		const latest = getLatestEntry(entries);

		if (!first || !latest) {
			return { hasData: false, delta: 0, status: 'neutral' };
		}

		const rawDelta = Number(latest.weight) - Number(first.weight);
		const delta = Math.round(rawDelta * 10) / 10;

		let status = 'neutral';
		if (delta > 0) status = 'gain';
		else if (delta < 0) status = 'loss';

		return { hasData: true, delta, status, first, latest };
	}, [entries]);

	const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				{/* Stall Detection Modal */}
				<Modal
					visible={macroModalVisible}
					transparent
					animationType='fade'
					onRequestClose={() => setMacroModalVisible(false)}
				>
					<View style={styles.modalBackdrop}>
						<View style={styles.modalCard}>
							<Text style={styles.modalTitle}>Progress Check</Text>

							<Text style={styles.modalBody}>
								Your average weight change over the last 7 days is under 0.5
								lbs. Lower your carbs by 15g to restart progress.
							</Text>

							{macroModalData?.eligible ? (
								<Text style={styles.modalSubtle}>
									Prev 7-day avg: {toFixed1(macroModalData.prev7Avg)} • Last
									7-day avg: {toFixed1(macroModalData.last7Avg)} • Weekly
									change: {toFixed1(macroModalData.weeklyLoss)} lbs
								</Text>
							) : null}

							<View style={styles.modalActionsRow}>
								<TouchableOpacity
									style={styles.modalSecondaryBtn}
									onPress={() => setMacroModalVisible(false)}
									activeOpacity={0.9}
								>
									<Text style={styles.modalSecondaryText}>Not Now</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.modalPrimaryBtn}
									onPress={applyCarbReduction}
									activeOpacity={0.9}
								>
									<Text style={styles.modalPrimaryText}>Apply -15g Carbs</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				{/* Header */}
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<View style={styles.iconBadge}>
							<Text style={styles.iconText}>⚖️</Text>
						</View>
						<Text style={styles.title}>{greeting}</Text>
					</View>

					<TouchableOpacity
						onPress={() =>
							Alert.alert('Settings', 'Settings screen not wired yet.')
						}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					>
						<Text style={styles.settingsIcon}>⚙️</Text>
					</TouchableOpacity>
				</View>

				{/* Calories & Macros */}
				<View style={styles.macrosCard}>
					<View style={styles.macrosHeader}>
						<Text style={styles.macrosTitle}>Calories & Macros</Text>
						<View style={styles.caloriePill}>
							<Text style={styles.caloriePillText}>
								{Math.round(calories)} cal
							</Text>
						</View>
					</View>

					<View style={styles.macroRow}>
						<View style={styles.macroChip}>
							<Text style={styles.macroChipLabel}>Protein</Text>
							<Text style={styles.macroChipValue}>{profile.protein}g</Text>
						</View>
						<View style={styles.macroChip}>
							<Text style={styles.macroChipLabel}>Carbs</Text>
							<Text style={styles.macroChipValue}>{profile.carbs}g</Text>
						</View>
						<View style={styles.macroChip}>
							<Text style={styles.macroChipLabel}>Fats</Text>
							<Text style={styles.macroChipValue}>{profile.fats}g</Text>
						</View>
					</View>
				</View>

				{/* Today's Weight */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Today's Weight</Text>

					<View style={styles.inputRow}>
						<TextInput
							value={weightText}
							onChangeText={(t) => setWeightText(normalizeWeightInput(t))}
							placeholder='Enter your weight…'
							placeholderTextColor='#8A94A6'
							keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
							style={styles.input}
							maxLength={6}
							returnKeyType='done'
						/>
						<View style={styles.lbsPill}>
							<Text style={styles.lbsText}>lbs</Text>
						</View>
					</View>

					<TouchableOpacity
						style={styles.saveButton}
						onPress={onSave}
						activeOpacity={0.85}
					>
						<Text style={styles.saveButtonText}>Save</Text>
					</TouchableOpacity>
				</View>

				{/* Total Weight Change Card */}
				<View style={styles.trackerCard}>
					<Text style={styles.trackerTitle}>Total Weight Change</Text>

					{!weightDelta.hasData ? (
						<Text style={styles.trackerSubtle}>
							Add at least two entries to see your progress.
						</Text>
					) : (
						<>
							<Text
								style={[
									styles.trackerValue,
									weightDelta.status === 'gain' && styles.trackerValueRed,
									weightDelta.status === 'loss' && styles.trackerValueGreen,
									weightDelta.status === 'neutral' && styles.trackerValueYellow
								]}
							>
								{weightDelta.delta > 0 && '+'}
								{weightDelta.delta < 0 && '-'}
								{toFixed1(Math.abs(weightDelta.delta))} lbs
							</Text>

							<Text style={styles.trackerSubtle}>
								From {formatDisplayDate(weightDelta.first.date)} (
								{toFixed1(weightDelta.first.weight)} lbs) to{' '}
								{formatDisplayDate(weightDelta.latest.date)} (
								{toFixed1(weightDelta.latest.weight)} lbs)
							</Text>
						</>
					)}
				</View>

				<View style={styles.divider} />

				{/* Weight History */}
				<View style={styles.section}>
					<View style={styles.historyHeaderRow}>
						<Text style={styles.sectionTitle}>Weight History</Text>
						<Text style={styles.subtle}>
							{entries.length ? `${entries.length} entries` : 'No entries yet'}
						</Text>
					</View>

					<View style={styles.card}>
						<FlatList
							data={recentEntries}
							keyExtractor={(item) => item.date}
							ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
							renderItem={({ item }) => (
								<View style={styles.historyRow}>
									<Text style={styles.historyDate}>
										{formatDisplayDate(item.date)}
									</Text>
									<Text style={styles.historyWeight}>
										{toFixed1(item.weight)} lbs
									</Text>
								</View>
							)}
							ListEmptyComponent={
								<View style={styles.emptyState}>
									<Text style={styles.emptyTitle}>No history yet</Text>
									<Text style={styles.emptyBody}>
										Add today's weight to start tracking your progress.
									</Text>
								</View>
							}
						/>
					</View>

					<TouchableOpacity
						style={styles.viewMoreButton}
						onPress={() =>
							Alert.alert('History', 'Full history screen not wired yet.')
						}
						activeOpacity={0.85}
					>
						<Text style={styles.viewMoreText}>View More</Text>
						<Text style={styles.viewMoreChevron}>›</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FFFFFF' },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 14
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	iconBadge: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: '#EFF4FF',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 18 },
	title: { fontSize: 26, fontWeight: '800', color: '#0B1220' },
	settingsIcon: { fontSize: 20, color: '#6B7280' },

	macrosCard: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14,
		marginBottom: 12
	},
	macrosHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	macrosTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
	caloriePill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#F3F4F6'
	},
	caloriePillText: { fontSize: 12, fontWeight: '900', color: '#111827' },
	macroRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
	macroChip: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#EEF2F7',
		borderRadius: 14,
		padding: 10,
		backgroundColor: '#FAFBFF'
	},
	macroChipLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
	macroChipValue: {
		marginTop: 6,
		fontSize: 16,
		fontWeight: '900',
		color: '#0B1220'
	},

	section: { marginTop: 6 },
	sectionTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#0B1220',
		marginBottom: 10
	},

	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#D9E1EE',
		borderRadius: 14,
		paddingHorizontal: 14,
		height: 54,
		backgroundColor: '#FFFFFF'
	},
	input: { flex: 1, fontSize: 18, color: '#0B1220' },
	lbsPill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#F3F4F6'
	},
	lbsText: { fontSize: 12, fontWeight: '700', color: '#374151' },

	saveButton: {
		marginTop: 12,
		height: 52,
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
	saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

	trackerCard: {
		marginTop: 14,
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14
	},
	trackerTitle: {
		fontSize: 14,
		fontWeight: '900',
		color: '#0B1220',
		marginBottom: 8
	},
	trackerValue: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
	trackerValueGreen: { color: '#10B981' },
	trackerValueRed: { color: '#EF4444' },
	trackerValueYellow: { color: '#F59E0B' },
	trackerSubtle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		lineHeight: 18
	},

	subtle: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 20 },

	card: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		overflow: 'hidden'
	},
	historyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 14,
		paddingVertical: 14
	},
	historyDate: { fontSize: 16, color: '#111827', fontWeight: '700' },
	historyWeight: { fontSize: 18, color: '#0B1220', fontWeight: '800' },

	emptyState: { paddingHorizontal: 14, paddingVertical: 18 },
	emptyTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#0B1220',
		marginBottom: 4
	},
	emptyBody: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 18
	},
	modalCard: {
		width: '100%',
		borderRadius: 18,
		backgroundColor: '#FFFFFF',
		padding: 18,
		borderWidth: 1,
		borderColor: '#E7EDF6'
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '900',
		color: '#0B1220',
		textAlign: 'center'
	},
	modalBody: {
		marginTop: 10,
		fontSize: 13,
		fontWeight: '700',
		color: '#111827',
		textAlign: 'center',
		lineHeight: 18
	},
	modalSubtle: {
		marginTop: 10,
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		textAlign: 'center'
	},
	modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
	modalSecondaryBtn: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalSecondaryText: { fontSize: 14, fontWeight: '900', color: '#111827' },
	modalPrimaryBtn: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#1E66F5',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalPrimaryText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
	divider: { height: 1, backgroundColor: '#EEF2F7', marginVertical: 18 },

	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},

	rowDivider: { height: 1, backgroundColor: '#EEF2F7' },

	viewMoreButton: {
		marginTop: 12,
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: 999,
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 16,
		paddingVertical: 10
	},
	viewMoreText: { fontSize: 14, fontWeight: '800', color: '#1E66F5' },
	viewMoreChevron: {
		fontSize: 18,
		fontWeight: '900',
		color: '#1E66F5',
		marginTop: -1
	}
});
