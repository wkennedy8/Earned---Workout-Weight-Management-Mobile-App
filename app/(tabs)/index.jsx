import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SettingsBottomSheet from '@/components/SettingsBottomSheet';
import { useProfile } from '@/hooks/useProfile';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { FontFamily } from '../../constants/fonts'; // Import font utilities
import { formatDisplayDate } from '../../utils/dateUtils';
import {
	isValidWeightNumber,
	normalizeWeightInput,
	toFixed1
} from '../../utils/numberUtils';
import { getTimeBasedGreeting } from '../../utils/weightUtils';

function getFirstEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[entries.length - 1]; // Last item = oldest (sorted newest-first)
}

function getLatestEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[0]; // First item = newest
}

function shouldSuggestMacroCut(entries, lastCarbReductionDate) {
	// Need at least 14 days of data
	if (!Array.isArray(entries) || entries.length < 14) {
		return { eligible: false, stalled: false, reason: 'insufficient_data' };
	}

	// Check if carbs were recently reduced (within last 7 days)
	if (lastCarbReductionDate) {
		const today = new Date();
		const lastReduction = new Date(lastCarbReductionDate);
		const daysSinceReduction = Math.floor(
			(today - lastReduction) / (1000 * 60 * 60 * 24)
		);

		if (daysSinceReduction < 7) {
			return {
				eligible: false,
				stalled: false,
				reason: 'recent_reduction',
				daysSinceReduction,
				daysRemaining: 7 - daysSinceReduction
			};
		}
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
		weeklyLoss,
		reason: stalled ? 'stalled' : 'progressing'
	};
}

export default function HomeScreen() {
	const router = useRouter();
	const [settingsVisible, setSettingsVisible] = useState(false);
	const [weightText, setWeightText] = useState('');

	// Hooks
	const { entries, todayKey, getEntryForDate, upsertEntry } =
		useWeightEntries();
	const { profile, calories, reduceCarbs } = useProfile();
	const greeting = useMemo(
		() => getTimeBasedGreeting(profile.name),
		[profile.name]
	);
	const goal = profile.goal; // 'lose' | 'maintain' | 'gain' | null

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

			// Stall rule check after save - pass lastCarbReductionDate from profile
			const check = shouldSuggestMacroCut(
				nextEntries,
				profile.lastCarbReductionDate
			);

			if (check.eligible && check.stalled) {
				setMacroModalData(check);
				setMacroModalVisible(true);
			} else if (check.reason === 'recent_reduction') {
				// Optional: inform user they recently reduced carbs
				console.log(
					`Carb reduction cooldown: ${check.daysRemaining} days remaining`
				);
			}
		} catch (e) {
			Alert.alert('Error', 'Could not save your weight. Please try again.');
		}
	}

	// Apply carb reduction from modal
	async function applyCarbReduction() {
		try {
			// Save both the carb reduction AND the date it happened
			await reduceCarbs(15, true); // Pass flag to save date
			setMacroModalVisible(false);
			setMacroModalData(null);
			Alert.alert('Updated', 'Carbs lowered by 15g. Check again in 7 days.');
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

		// Determine status based on goal
		if (goal === 'lose') {
			// Losing weight: negative delta is good (green), positive is bad (red)
			if (delta < 0) status = 'good';
			else if (delta > 0) status = 'bad';
		} else if (goal === 'gain') {
			// Gaining weight: positive delta is good (green), negative is bad (red)
			if (delta > 0) status = 'good';
			else if (delta < 0) status = 'bad';
		} else if (goal === 'maintain') {
			// Maintaining: any change is neutral/yellow
			status = 'neutral';
		} else {
			// No goal set: use neutral for any change
			status = 'neutral';
		}

		return { hasData: true, delta, status, first, latest };
	}, [entries, goal]);

	const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={{ flex: 1 }}
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

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.headerRow}>
						<View style={styles.headerLeft}>
							{/* <View style={styles.iconBadge}>
								<Text style={styles.iconText}>⚖️</Text>
							</View> */}
							<Text style={styles.title}>{greeting}</Text>
						</View>

						<TouchableOpacity
							onPress={() => router.push('/profile')}
							hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
							style={styles.profileButton}
						>
							{profile.profilePhotoUri ? (
								<Image
									source={{ uri: profile.profilePhotoUri }}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profilePlaceholder}>
									<Text style={styles.profilePlaceholderText}>👤</Text>
								</View>
							)}
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
										weightDelta.status === 'good' && styles.trackerValueGreen,
										weightDelta.status === 'bad' && styles.trackerValueRed,
										weightDelta.status === 'neutral' &&
											styles.trackerValueYellow
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
								{entries.length
									? `${entries.length} entries`
									: 'No entries yet'}
							</Text>
						</View>

						<View style={styles.card}>
							<FlatList
								data={recentEntries}
								keyExtractor={(item) => item.date}
								ItemSeparatorComponent={() => (
									<View style={styles.rowDivider} />
								)}
								scrollEnabled={false}
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
				</ScrollView>
			</KeyboardAvoidingView>
			<SettingsBottomSheet
				visible={settingsVisible}
				onClose={() => setSettingsVisible(false)}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000', paddingBottom: 90 },
	container: { flex: 1 },

	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 20
	},

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
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 18 },
	title: {
		fontSize: 26,
		fontFamily: FontFamily.extraBold,
		color: '#FFFFFF'
	},

	profileButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	profileImage: {
		width: '100%',
		height: '100%'
	},
	profilePlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1A1A1A'
	},
	profilePlaceholderText: {
		fontSize: 20
	},

	macrosCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	macrosHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	macrosTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#fff'
	},
	caloriePill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A'
	},
	caloriePillText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	macroRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
	macroChip: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		padding: 10,
		backgroundColor: '#0D0D0D'
	},
	macroChipLabel: {
		fontSize: 11,
		fontFamily: FontFamily.extraBold,
		color: '#999999'
	},
	macroChipValue: {
		marginTop: 6,
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},

	section: { marginTop: 6 },
	sectionTitle: {
		fontSize: 18,
		fontFamily: FontFamily.extraBold,
		color: '#fff',
		marginBottom: 10
	},

	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		paddingHorizontal: 14,
		height: 54,
		backgroundColor: '#1A1A1A'
	},
	input: {
		flex: 1,
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	lbsPill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A'
	},
	lbsText: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},

	saveButton: {
		marginTop: 12,
		height: 52,
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
	saveButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.extraBold
	},

	trackerCard: {
		marginTop: 14,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14
	},
	trackerTitle: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#fff',
		marginBottom: 8
	},
	trackerValue: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		marginBottom: 8
	},
	trackerValueGreen: { color: '#AFFF2B' },
	trackerValueRed: { color: '#FF453A' },
	trackerValueYellow: { color: '#FFD60A' },
	trackerSubtle: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999',
		lineHeight: 18
	},

	subtle: {
		fontSize: 12,
		color: '#999999',
		fontFamily: FontFamily.semiBold,
		marginTop: 20
	},

	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		overflow: 'hidden'
	},
	historyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 14,
		paddingVertical: 14
	},
	historyDate: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: FontFamily.black
	},
	historyWeight: {
		fontSize: 18,
		color: '#AFFF2B',
		fontFamily: FontFamily.extraBold
	},

	emptyState: { paddingHorizontal: 14, paddingVertical: 18 },
	emptyTitle: {
		fontSize: 16,
		fontFamily: FontFamily.extraBold,
		color: '#FFFFFF',
		marginBottom: 4
	},
	emptyBody: {
		fontSize: 13,
		color: '#999999',
		fontFamily: FontFamily.semiBold,
		lineHeight: 18
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
	modalBody: {
		marginTop: 10,
		fontSize: 13,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		textAlign: 'center',
		lineHeight: 18
	},
	modalSubtle: {
		marginTop: 10,
		fontSize: 12,
		fontFamily: FontFamily.bold,
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
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalPrimaryText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#000000'
	},
	divider: { height: 1, backgroundColor: '#333333', marginVertical: 18 },

	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},

	rowDivider: { height: 1, backgroundColor: '#333333' },

	viewMoreButton: {
		marginTop: 12,
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A',
		paddingHorizontal: 16,
		paddingVertical: 10
	},
	viewMoreText: {
		fontSize: 14,
		fontFamily: FontFamily.extraBold,
		color: '#AFFF2B'
	},
	viewMoreChevron: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		marginTop: -1
	}
});
