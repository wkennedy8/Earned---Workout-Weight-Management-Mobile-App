import { useAuth } from '@/context/AuthContext';
import {
	addProgressPhoto,
	deleteProgressPhotoFromStorage,
	deleteProgressPhotoMetadata,
	getProfile,
	getProgressPhotos,
	getUserSettings,
	updateUserSettings,
	uploadProfilePhoto,
	uploadProgressPhoto,
	upsertProfile
} from '@/controllers/profileController';
import {
	cleanPhoneNumber,
	formatPhoneNumber,
	isValidPhoneNumber
} from '@/utils/numberUtils';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

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

// Email validation helper
function isValidEmail(email) {
	if (!email) return true;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
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

export default function ProfileScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [profilePhotoUri, setProfilePhotoUri] = useState(null);

	// macros stored as text for inputs
	const [protein, setProtein] = useState('');
	const [carbs, setCarbs] = useState('');
	const [fats, setFats] = useState('');

	const [progressPhotos, setProgressPhotos] = useState([]); // [{ id, downloadURL, storagePath, createdAt }]
	const [goal, setGoal] = useState(null); // 'lose' | 'maintain' | 'gain' | null

	// Profile information state
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');

	// ---- Derived calories
	const calories = useMemo(() => {
		const p = Number(protein) || 0;
		const c = Number(carbs) || 0;
		const f = Number(fats) || 0;
		return p * 4 + c * 4 + f * 9;
	}, [protein, carbs, fats]);

	// ---- Load persisted data from Firebase
	useEffect(() => {
		let isMounted = true;

		(async () => {
			try {
				if (!user?.uid) {
					setLoading(false);
					return;
				}

				// Load profile data (macros + profile photo + goal)
				const profileData = await getProfile(user.uid);

				if (!isMounted) return;

				setProtein(String(profileData.protein || 0));
				setCarbs(String(profileData.carbs || 0));
				setFats(String(profileData.fats || 0));
				setProfilePhotoUri(profileData.profilePhotoUri);
				setGoal(profileData.goal);

				// Load user settings (name, email, phone)
				const settings = await getUserSettings(user.uid);

				if (!isMounted) return;

				setName(settings.name);
				setEmail(settings.email);
				setPhone(formatPhoneNumber(settings.phone));

				// Load progress photos
				const photos = await getProgressPhotos(user.uid);

				if (!isMounted) return;

				setProgressPhotos(photos);
			} catch (e) {
				console.warn('Failed to load profile:', e);
			} finally {
				if (isMounted) setLoading(false);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [user?.uid]);

	async function onSaveMacros() {
		if (!user?.uid) return;

		Keyboard.dismiss();

		try {
			await upsertProfile(user.uid, {
				protein: Number(protein) || 0,
				carbs: Number(carbs) || 0,
				fats: Number(fats) || 0
			});

			Alert.alert('Saved', 'Macros updated.');
		} catch (e) {
			console.warn('Failed to save macros:', e);
			Alert.alert('Error', 'Failed to save macros. Please try again.');
		}
	}

	async function onSaveProfileInfo() {
		if (!user?.uid) return;

		Keyboard.dismiss();

		if (!isValidEmail(email)) {
			Alert.alert('Invalid Email', 'Please enter a valid email address.');
			return;
		}

		if (!isValidPhoneNumber(phone)) {
			Alert.alert(
				'Invalid Phone',
				'Please enter a valid 10-digit phone number.'
			);
			return;
		}

		try {
			await updateUserSettings(user.uid, {
				name: name.trim(),
				email: email.trim(),
				phone: cleanPhoneNumber(phone)
			});

			Alert.alert('Saved', 'Profile information updated.');
		} catch (e) {
			console.warn('Failed to save profile info:', e);
			Alert.alert('Error', 'Failed to save profile info. Please try again.');
		}
	}

	async function onSelectGoal(selectedGoal) {
		if (!user?.uid) return;

		try {
			// Update local state immediately for responsive UI
			setGoal(selectedGoal);

			// Save to Firebase
			await upsertProfile(user.uid, {
				goal: selectedGoal
			});
		} catch (e) {
			console.warn('Failed to save goal:', e);
			Alert.alert('Error', 'Failed to save goal. Please try again.');
			// Revert local state on error
			setGoal(goal);
		}
	}

	async function pickProfilePhoto() {
		if (!user?.uid) return;

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

		try {
			// Upload to Firebase Storage
			const downloadURL = await uploadProfilePhoto(user.uid, uri);

			// Update local state
			setProfilePhotoUri(downloadURL);

			// Save download URL to Firestore
			await upsertProfile(user.uid, {
				profilePhotoUri: downloadURL
			});

			Alert.alert('Success', 'Profile photo updated.');
		} catch (e) {
			console.warn('Failed to upload profile photo:', e);
			Alert.alert('Error', 'Failed to upload photo. Please try again.');
		}
	}

	async function addProgressFromLibrary() {
		if (!user?.uid) return;

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

		try {
			// Upload to Firebase Storage
			const downloadURL = await uploadProgressPhoto(user.uid, uri);

			// Get storage path for deletion later
			const timestamp = Date.now();
			const storagePath = `profiles/${user.uid}/progress/${timestamp}.jpg`;

			// Save metadata to Firestore
			const newPhoto = await addProgressPhoto(user.uid, {
				downloadURL,
				storagePath
			});

			// Update local state (add to beginning of array)
			setProgressPhotos([newPhoto, ...progressPhotos]);

			Alert.alert('Success', 'Progress photo added.');
		} catch (e) {
			console.warn('Failed to add progress photo:', e);
			Alert.alert('Error', 'Failed to upload photo. Please try again.');
		}
	}

	async function takeProgressPhoto() {
		if (!user?.uid) return;

		const ok = await requestCameraPermissions();
		if (!ok) return;

		const result = await ImagePicker.launchCameraAsync({
			quality: 0.9,
			allowsEditing: true
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (!uri) return;

		try {
			// Upload to Firebase Storage
			const downloadURL = await uploadProgressPhoto(user.uid, uri);

			// Get storage path for deletion later
			const timestamp = Date.now();
			const storagePath = `profiles/${user.uid}/progress/${timestamp}.jpg`;

			// Save metadata to Firestore
			const newPhoto = await addProgressPhoto(user.uid, {
				downloadURL,
				storagePath
			});

			// Update local state (add to beginning of array)
			setProgressPhotos([newPhoto, ...progressPhotos]);

			Alert.alert('Success', 'Progress photo added.');
		} catch (e) {
			console.warn('Failed to take progress photo:', e);
			Alert.alert('Error', 'Failed to upload photo. Please try again.');
		}
	}

	function confirmDeleteProgressPhoto(photoId) {
		if (!user?.uid) return;

		Alert.alert(
			'Delete photo?',
			'This will remove the photo from your progress gallery.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							// Find the photo to get its storage path
							const photo = progressPhotos.find((p) => p.id === photoId);

							if (!photo) return;

							// Delete from Firebase Storage
							if (photo.storagePath) {
								await deleteProgressPhotoFromStorage(photo.storagePath);
							}

							// Delete metadata from Firestore
							await deleteProgressPhotoMetadata(user.uid, photoId);

							// Update local state
							const next = progressPhotos.filter((p) => p.id !== photoId);
							setProgressPhotos(next);

							Alert.alert('Deleted', 'Progress photo removed.');
						} catch (e) {
							console.warn('Failed to delete progress photo:', e);
							Alert.alert('Error', 'Failed to delete photo. Please try again.');
						}
					}
				}
			]
		);
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<Text style={styles.loadingText}>Loading profile…</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.headerRow}>
						<TouchableOpacity
							onPress={() => router.back()}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							activeOpacity={0.7}
						>
							<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
						</TouchableOpacity>
					</View>
					{/* Profile Photo */}
					<View style={styles.card}>
						<Text style={styles.subtle}>
							Upload a photo to personalize your profile.
						</Text>

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

					{/* Profile Information */}
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Profile Information</Text>

						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>Name</Text>
							<TextInput
								value={name}
								onChangeText={setName}
								placeholder='Enter your name'
								placeholderTextColor='#666666'
								style={styles.textInput}
								autoCapitalize='words'
							/>
						</View>

						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>Email</Text>
							<TextInput
								value={email}
								onChangeText={setEmail}
								placeholder='Enter your email'
								placeholderTextColor='#666666'
								style={styles.textInput}
								keyboardType='email-address'
								autoCapitalize='none'
								autoCorrect={false}
							/>
						</View>

						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>Phone Number</Text>
							<TextInput
								value={phone}
								onChangeText={(text) => setPhone(formatPhoneNumber(text))}
								placeholder='(555) 123-4567'
								placeholderTextColor='#666666'
								style={styles.textInput}
								keyboardType='phone-pad'
								maxLength={14}
							/>
						</View>

						<TouchableOpacity
							style={styles.saveBtn}
							onPress={onSaveProfileInfo}
							activeOpacity={0.9}
						>
							<Text style={styles.saveBtnText}>Save Changes</Text>
						</TouchableOpacity>
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

					{/* Goal */}
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Goal</Text>
						<Text style={styles.subtle}>What's your fitness goal?</Text>

						<View style={styles.goalOptions}>
							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'lose' && styles.goalOptionActive
								]}
								onPress={() => onSelectGoal('lose')}
								activeOpacity={0.7}
							>
								<Ionicons
									name='trending-down'
									size={28}
									color={goal === 'lose' ? '#000' : '#666666'}
								/>
								<Text
									style={[
										styles.goalText,
										goal === 'lose' && styles.goalTextActive
									]}
								>
									Lose Weight
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'maintain' && styles.goalOptionActive
								]}
								onPress={() => onSelectGoal('maintain')}
								activeOpacity={0.7}
							>
								<Ionicons
									name='remove-outline'
									size={28}
									color={goal === 'maintain' ? '#000' : '#666666'}
								/>
								<Text
									style={[
										styles.goalText,
										goal === 'maintain' && styles.goalTextActive
									]}
								>
									Maintain Weight
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'gain' && styles.goalOptionActive
								]}
								onPress={() => onSelectGoal('gain')}
								activeOpacity={0.7}
							>
								<Ionicons
									name='trending-up'
									size={28}
									color={goal === 'gain' ? '#000' : '#666666'}
								/>
								<Text
									style={[
										styles.goalText,
										goal === 'gain' && styles.goalTextActive
									]}
								>
									Gain Weight
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Progress Photos */}
					<View style={styles.card}>
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

						<View style={styles.progressGrid}>
							{progressPhotos.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyTitle}>No progress photos yet</Text>
									<Text style={styles.emptyBody}>
										Take a weekly photo to track visible changes over time.
										Long-press a photo to delete it.
									</Text>
								</View>
							) : (
								progressPhotos.map((item) => (
									<TouchableOpacity
										key={item.id}
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
										<Image
											source={{ uri: item.downloadURL }}
											style={styles.progressImg}
										/>
										<View style={styles.progressBadge}>
											<Text style={styles.progressBadgeText}>
												{formatDisplayDate(item.createdAt)}
											</Text>
										</View>
									</TouchableOpacity>
								))
							)}
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },

	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 120,
		gap: 12
	},

	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, fontWeight: '700', color: '#999999' },

	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14
	},
	sectionTitle: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: FontFamily.black
	},
	subtle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
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
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#333333'
	},
	avatarImg: { width: '100%', height: '100%' },
	avatarPlaceholder: {
		fontSize: 30,
		fontWeight: '900',
		color: '#666666',
		marginTop: -2
	},

	primaryBtn: {
		marginTop: 10,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
		paddingHorizontal: 14
	},
	primaryBtnText: {
		color: '#AFFF2B',
		fontSize: 14,
		fontFamily: FontFamily.black
	},

	// Profile Information styles
	fieldGroup: { marginTop: 14 },
	fieldLabel: {
		fontSize: 12,
		fontWeight: '800',
		color: '#999999',
		marginBottom: 8
	},
	textInput: {
		height: 48,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 14,
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#0D0D0D'
	},

	cardHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	caloriePill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A'
	},
	caloriePillText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

	macroGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
	macroBox: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		padding: 10,
		backgroundColor: '#0D0D0D'
	},
	macroLabel: { fontSize: 11, fontWeight: '800', color: '#999999' },
	macroInput: {
		marginTop: 8,
		height: 44,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 12,
		fontSize: 16,
		fontWeight: '900',
		color: '#FFFFFF',
		backgroundColor: '#0D0D0D'
	},

	saveBtn: {
		marginTop: 12,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveBtnText: { color: '#000000', fontSize: 16, fontFamily: FontFamily.black },

	goalOptions: { marginTop: 12, gap: 10 },
	goalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#333333',
		backgroundColor: '#0D0D0D'
	},
	goalOptionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	goalText: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	goalTextActive: {
		color: '#000000'
	},

	progressActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
	secondaryBtn: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	secondaryBtnText: {
		fontSize: 14,
		color: '#AFFF2B',
		fontFamily: FontFamily.black
	},

	progressGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		marginTop: 12
	},

	progressTile: {
		width: '31.5%',
		aspectRatio: 1,
		borderRadius: 14,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#333333',
		backgroundColor: '#2A2A2A'
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
		backgroundColor: 'rgba(0,0,0,0.6)'
	},
	progressBadgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontFamily: FontFamily.black,
		textAlign: 'center'
	},

	emptyState: { paddingTop: 12, width: '100%' },
	emptyTitle: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginBottom: 6
	},
	emptyBody: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		lineHeight: 18
	}
});
