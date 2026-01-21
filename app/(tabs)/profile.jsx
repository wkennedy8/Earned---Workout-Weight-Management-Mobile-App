import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	FlatList,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_PROFILE_KEY = 'profile_v1';
const STORAGE_PROGRESS_KEY = 'progress_photos_v1';
const REMINDER_ID_KEY = 'progress_photo_reminder_id_v1';

// Ensure notifications show an alert
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false
	})
});

function normalizeInt(text) {
	return text.replace(/[^\d]/g, '').slice(0, 4);
}

function formatDisplayDate(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

function formatLocalDateKey(date = new Date()) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function hasProgressPhotoToday(photos) {
	const todayKey = formatLocalDateKey(new Date());
	return (photos || []).some((p) => {
		const dt = new Date(p.createdAt);
		if (Number.isNaN(dt.getTime())) return false;
		return formatLocalDateKey(dt) === todayKey;
	});
}

function getNext8pmTrigger() {
	const now = new Date();
	const trigger = new Date(now);
	trigger.setHours(20, 0, 0, 0); // 8:00 PM local time

	// If it's already past 8pm today, schedule for tomorrow 8pm
	if (now.getTime() >= trigger.getTime()) {
		trigger.setDate(trigger.getDate() + 1);
	}
	return trigger;
}

async function requestMediaPermissions() {
	const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!media.granted) {
		Alert.alert(
			'Permission required',
			'Please allow photo library access to upload images.'
		);
		return false;
	}
	return true;
}

async function requestCameraPermissions() {
	const cam = await ImagePicker.requestCameraPermissionsAsync();
	if (!cam.granted) {
		Alert.alert(
			'Permission required',
			'Please allow camera access to take progress photos.'
		);
		return false;
	}
	return true;
}

async function registerForNotificationsAsync() {
	const current = await Notifications.getPermissionsAsync();
	let status = current.status;

	if (status !== 'granted') {
		const req = await Notifications.requestPermissionsAsync();
		status = req.status;
	}

	return status === 'granted';
}

async function cancelProgressReminder() {
	try {
		const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
		if (id) {
			await Notifications.cancelScheduledNotificationAsync(id);
			await AsyncStorage.removeItem(REMINDER_ID_KEY);
		}
	} catch (e) {
		console.warn('Failed to cancel reminder:', e);
	}
}

async function scheduleProgressReminderIfNeeded(photos) {
	try {
		// If there is a photo today, don't schedule (and cancel any pending one)
		if (hasProgressPhotoToday(photos)) {
			await cancelProgressReminder();
			return;
		}

		// Always cancel any previous scheduled reminder before scheduling a new one
		await cancelProgressReminder();

		const triggerDate = getNext8pmTrigger();

		const id = await Notifications.scheduleNotificationAsync({
			content: {
				title: 'Progress Photo Reminder',
				body: 'You haven’t uploaded a progress photo today. Take one now to stay consistent.'
			},
			trigger: triggerDate
		});

		await AsyncStorage.setItem(REMINDER_ID_KEY, id);
	} catch (e) {
		console.warn('Failed to schedule reminder:', e);
	}
}

export default function ProfileScreen() {
	const [profilePhotoUri, setProfilePhotoUri] = useState(null);

	// macros stored as text for inputs
	const [protein, setProtein] = useState('');
	const [carbs, setCarbs] = useState('');
	const [fats, setFats] = useState('');

	const [progressPhotos, setProgressPhotos] = useState([]); // [{ id, uri, createdAt }]

	// ---- Derived calories
	const calories = useMemo(() => {
		const p = Number(protein) || 0;
		const c = Number(carbs) || 0;
		const f = Number(fats) || 0;
		return p * 4 + c * 4 + f * 9;
	}, [protein, carbs, fats]);

	// ---- Load persisted data + schedule reminder if needed
	useEffect(() => {
		(async () => {
			try {
				const rawProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
				if (rawProfile) {
					const parsed = JSON.parse(rawProfile);
					if (parsed?.profilePhotoUri)
						setProfilePhotoUri(parsed.profilePhotoUri);
					if (parsed?.protein != null) setProtein(String(parsed.protein));
					if (parsed?.carbs != null) setCarbs(String(parsed.carbs));
					if (parsed?.fats != null) setFats(String(parsed.fats));
				}

				const rawPhotos = await AsyncStorage.getItem(STORAGE_PROGRESS_KEY);
				const parsedPhotos = rawPhotos ? JSON.parse(rawPhotos) : [];
				const safe = Array.isArray(parsedPhotos) ? parsedPhotos : [];
				safe.sort((a, b) =>
					String(b.createdAt).localeCompare(String(a.createdAt))
				);
				setProgressPhotos(safe);

				// Notifications: ask permission and schedule reminder if needed
				const ok = await registerForNotificationsAsync();
				if (ok) {
					await scheduleProgressReminderIfNeeded(safe);
				}
			} catch (e) {
				console.warn('Failed to load profile:', e);
			}
		})();
	}, []);

	async function saveProfile(next) {
		try {
			await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
		} catch (e) {
			console.warn('Failed to save profile:', e);
		}
	}

	async function saveProgressPhotos(next) {
		try {
			await AsyncStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(next));
		} catch (e) {
			console.warn('Failed to save progress photos:', e);
		}
	}

	function onSaveMacros() {
		Keyboard.dismiss();
		const next = {
			profilePhotoUri,
			protein: Number(protein) || 0,
			carbs: Number(carbs) || 0,
			fats: Number(fats) || 0,
			updatedAt: new Date().toISOString()
		};
		saveProfile(next);
		Alert.alert('Saved', 'Macros updated.');
	}

	async function pickProfilePhoto() {
		const ok = await requestMediaPermissions();
		if (!ok) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
			allowsEditing: true,
			aspect: [1, 1]
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (!uri) return;

		setProfilePhotoUri(uri);
		await saveProfile({
			profilePhotoUri: uri,
			protein: Number(protein) || 0,
			carbs: Number(carbs) || 0,
			fats: Number(fats) || 0,
			updatedAt: new Date().toISOString()
		});
	}

	async function addProgressFromLibrary() {
		const ok = await requestMediaPermissions();
		if (!ok) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
			allowsEditing: true
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (!uri) return;

		const next = [
			{ id: `${Date.now()}`, uri, createdAt: new Date().toISOString() },
			...progressPhotos
		];

		setProgressPhotos(next);
		await saveProgressPhotos(next);

		// Re-check reminder: this will cancel today’s if satisfied, or schedule the next
		await scheduleProgressReminderIfNeeded(next);
	}

	async function takeProgressPhoto() {
		const ok = await requestCameraPermissions();
		if (!ok) return;

		const result = await ImagePicker.launchCameraAsync({
			quality: 0.9,
			allowsEditing: true
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (!uri) return;

		const next = [
			{ id: `${Date.now()}`, uri, createdAt: new Date().toISOString() },
			...progressPhotos
		];

		setProgressPhotos(next);
		await saveProgressPhotos(next);

		// Re-check reminder: this will cancel today’s if satisfied, or schedule the next
		await scheduleProgressReminderIfNeeded(next);
	}

	function confirmDeleteProgressPhoto(photoId) {
		Alert.alert(
			'Delete photo?',
			'This will remove the photo from your progress gallery.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const next = progressPhotos.filter((p) => p.id !== photoId);
						setProgressPhotos(next);
						await saveProgressPhotos(next);

						// If they deleted today's only photo, we may need to re-schedule reminder
						const ok = await registerForNotificationsAsync();
						if (ok) {
							await scheduleProgressReminderIfNeeded(next);
						}
					}
				}
			]
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				{/* Header */}
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<View style={styles.iconBadge}>
							<Text style={styles.iconText}>👤</Text>
						</View>
						<Text style={styles.title}>Profile</Text>
					</View>
				</View>

				{/* Profile Photo */}
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Profile Photo</Text>

					<View style={styles.photoRow}>
						<View style={styles.avatar}>
							{profilePhotoUri ? (
								<Image
									source={{ uri: profilePhotoUri }}
									style={styles.avatarImg}
								/>
							) : (
								<Text style={styles.avatarPlaceholder}>+</Text>
							)}
						</View>

						<View style={{ flex: 1 }}>
							<Text style={styles.subtle}>
								Upload a photo to personalize your profile.
							</Text>
							<TouchableOpacity
								style={styles.primaryBtn}
								onPress={pickProfilePhoto}
								activeOpacity={0.9}
							>
								<Text style={styles.primaryBtnText}>
									{profilePhotoUri ? 'Change Photo' : 'Upload Photo'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Macros */}
				<View style={styles.card}>
					<View style={styles.cardHeaderRow}>
						<Text style={styles.sectionTitle}>Daily Macros</Text>
						<View style={styles.caloriePill}>
							<Text style={styles.caloriePillText}>
								{Math.round(calories)} cal
							</Text>
						</View>
					</View>

					<Text style={styles.subtle}>
						Enter your current macro targets. Calories are calculated
						automatically.
					</Text>

					<View style={styles.macroGrid}>
						<View style={styles.macroBox}>
							<Text style={styles.macroLabel}>Protein (g)</Text>
							<TextInput
								value={protein}
								onChangeText={(t) => setProtein(normalizeInt(t))}
								keyboardType='numeric'
								placeholder='0'
								placeholderTextColor='#9CA3AF'
								style={styles.macroInput}
							/>
						</View>

						<View style={styles.macroBox}>
							<Text style={styles.macroLabel}>Carbs (g)</Text>
							<TextInput
								value={carbs}
								onChangeText={(t) => setCarbs(normalizeInt(t))}
								keyboardType='numeric'
								placeholder='0'
								placeholderTextColor='#9CA3AF'
								style={styles.macroInput}
							/>
						</View>

						<View style={styles.macroBox}>
							<Text style={styles.macroLabel}>Fats (g)</Text>
							<TextInput
								value={fats}
								onChangeText={(t) => setFats(normalizeInt(t))}
								keyboardType='numeric'
								placeholder='0'
								placeholderTextColor='#9CA3AF'
								style={styles.macroInput}
							/>
						</View>
					</View>

					<TouchableOpacity
						style={styles.saveBtn}
						onPress={onSaveMacros}
						activeOpacity={0.9}
					>
						<Text style={styles.saveBtnText}>Save Macros</Text>
					</TouchableOpacity>
				</View>

				{/* Progress Photos */}
				<View style={[styles.card, { flex: 1 }]}>
					<View style={styles.cardHeaderRow}>
						<Text style={styles.sectionTitle}>Progress Photos</Text>
						<Text style={styles.subtle}>
							{progressPhotos.length
								? `${progressPhotos.length} photos`
								: 'No photos yet'}
						</Text>
					</View>

					<View style={styles.progressActions}>
						<TouchableOpacity
							style={styles.secondaryBtn}
							onPress={takeProgressPhoto}
							activeOpacity={0.9}
						>
							<Text style={styles.secondaryBtnText}>Take Photo</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.secondaryBtn}
							onPress={addProgressFromLibrary}
							activeOpacity={0.9}
						>
							<Text style={styles.secondaryBtnText}>Upload</Text>
						</TouchableOpacity>
					</View>

					<FlatList
						data={progressPhotos}
						keyExtractor={(item) => item.id}
						numColumns={3}
						columnWrapperStyle={{ gap: 10 }}
						contentContainerStyle={{
							gap: 10,
							paddingTop: 12,
							paddingBottom: 10
						}}
						renderItem={({ item }) => (
							<TouchableOpacity
								activeOpacity={0.9}
								onLongPress={() => confirmDeleteProgressPhoto(item.id)}
								onPress={() =>
									Alert.alert(
										'Progress Photo',
										formatDisplayDate(item.createdAt)
									)
								}
								style={styles.progressTile}
							>
								<Image source={{ uri: item.uri }} style={styles.progressImg} />
								<View style={styles.progressBadge}>
									<Text style={styles.progressBadgeText}>
										{formatDisplayDate(item.createdAt)}
									</Text>
								</View>
							</TouchableOpacity>
						)}
						ListEmptyComponent={
							<View style={styles.emptyState}>
								<Text style={styles.emptyTitle}>No progress photos yet</Text>
								<Text style={styles.emptyBody}>
									Take a weekly photo to track visible changes over time.
									Long-press a photo to delete it.
								</Text>
							</View>
						}
					/>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// styles unchanged from your version
const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FFFFFF' },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 10, gap: 12 },

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
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

	card: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14
	},
	sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
	subtle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		marginTop: 6,
		lineHeight: 18
	},

	photoRow: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 12,
		alignItems: 'center'
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: 18,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#E5E7EB'
	},
	avatarImg: { width: '100%', height: '100%' },
	avatarPlaceholder: {
		fontSize: 30,
		fontWeight: '900',
		color: '#9CA3AF',
		marginTop: -2
	},

	primaryBtn: {
		marginTop: 10,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#1E66F5',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
		paddingHorizontal: 14
	},
	primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

	cardHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	caloriePill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#F3F4F6'
	},
	caloriePillText: { fontSize: 12, fontWeight: '900', color: '#111827' },

	macroGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
	macroBox: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#EEF2F7',
		borderRadius: 14,
		padding: 10,
		backgroundColor: '#FAFBFF'
	},
	macroLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
	macroInput: {
		marginTop: 8,
		height: 44,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 12,
		paddingHorizontal: 12,
		fontSize: 16,
		fontWeight: '900',
		color: '#0B1220',
		backgroundColor: '#FFFFFF'
	},

	saveBtn: {
		marginTop: 12,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#1E66F5',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },

	progressActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
	secondaryBtn: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center'
	},
	secondaryBtnText: { fontSize: 14, fontWeight: '900', color: '#1E66F5' },

	progressTile: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 14,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#E7EDF6',
		backgroundColor: '#F3F4F6'
	},
	progressImg: { width: '100%', height: '100%' },
	progressBadge: {
		position: 'absolute',
		left: 6,
		right: 6,
		bottom: 6,
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 12,
		backgroundColor: 'rgba(0,0,0,0.35)'
	},
	progressBadgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: '900',
		textAlign: 'center'
	},

	emptyState: { paddingTop: 12 },
	emptyTitle: {
		fontSize: 14,
		fontWeight: '900',
		color: '#0B1220',
		marginBottom: 6
	},
	emptyBody: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		lineHeight: 18
	}
});
