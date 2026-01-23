import { useAuth } from '@/context/AuthContext';
import {
	getProfile,
	getUserSettings,
	updateUserSettings,
	uploadProfilePhoto,
	upsertProfile
} from '@/controllers/profileController';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
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

export default function EditProfileScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [profilePhoto, setProfilePhoto] = useState(null);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const [profile, settings] = await Promise.all([
					getProfile(user.uid),
					getUserSettings(user.uid)
				]);

				setName(settings.name || '');
				setEmail(settings.email || '');

				// Remove +1 prefix before formatting
				const phoneWithoutCountryCode =
					settings.phone?.replace(/^\+1/, '') || '';
				setPhone(phoneWithoutCountryCode);

				setProfilePhoto(profile?.profilePhotoUri || null);
			} catch (error) {
				console.error('Failed to load profile:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSave() {
		if (!user?.uid) return;

		setSaving(true);
		try {
			await updateUserSettings(user.uid, {
				name: name.trim(),
				email: email.trim()
			});

			Alert.alert('Success', 'Profile updated successfully');
			router.back();
		} catch (error) {
			console.error('Failed to save profile:', error);
			Alert.alert('Error', 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	}

	async function handlePickPhoto() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission required', 'Please allow photo library access.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
			allowsEditing: true,
			aspect: [1, 1]
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (!uri) return;

		setUploadingPhoto(true);
		try {
			const photoUrl = await uploadProfilePhoto(user.uid, uri);
			await upsertProfile(user.uid, { profilePhotoUri: photoUrl });
			setProfilePhoto(photoUrl);
			Alert.alert('Success', 'Profile photo updated');
		} catch (error) {
			console.error('Failed to upload photo:', error);
			Alert.alert('Error', 'Failed to upload photo');
		} finally {
			setUploadingPhoto(false);
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
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
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* Photo Section */}
					<View style={styles.photoSection}>
						<TouchableOpacity
							style={styles.photoCircle}
							onPress={handlePickPhoto}
							disabled={uploadingPhoto}
							activeOpacity={0.8}
						>
							{uploadingPhoto ? (
								<ActivityIndicator size='large' color='#AFFF2B' />
							) : profilePhoto ? (
								<Image
									source={{ uri: profilePhoto }}
									style={styles.photoImage}
								/>
							) : (
								<View style={styles.photoPlaceholder}>
									<Ionicons name='camera-outline' size={40} color='#666666' />
								</View>
							)}
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.changePhotoButton}
							onPress={handlePickPhoto}
							disabled={uploadingPhoto}
							activeOpacity={0.9}
						>
							<Text style={styles.changePhotoText}>
								{profilePhoto ? 'Change Photo' : 'Add Photo'}
							</Text>
						</TouchableOpacity>
					</View>

					{/* Form Fields */}
					<View style={styles.formSection}>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Name</Text>
							<TextInput
								style={styles.input}
								value={name}
								onChangeText={setName}
								placeholder='Enter your name'
								placeholderTextColor='#666666'
								autoCapitalize='words'
							/>
						</View>

						<View style={styles.inputGroup}>
							<Text style={styles.label}>Email</Text>
							<TextInput
								style={styles.input}
								value={email}
								onChangeText={setEmail}
								placeholder='Enter your email'
								placeholderTextColor='#666666'
								keyboardType='email-address'
								autoCapitalize='none'
							/>
						</View>

						<View style={styles.inputGroup}>
							<Text style={styles.label}>Phone</Text>
							<TextInput
								style={[styles.input, styles.inputDisabled]}
								value={phone}
								editable={false}
								placeholder='Phone number'
								placeholderTextColor='#666666'
							/>
							<Text style={styles.helperText}>
								Phone number cannot be changed
							</Text>
						</View>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={styles.bottomButton}>
					<TouchableOpacity
						style={styles.saveButton}
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.9}
					>
						{saving ? (
							<ActivityIndicator color='#000000' />
						) : (
							<Text style={styles.saveButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 100
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},

	photoSection: {
		alignItems: 'center',
		marginBottom: 32
	},
	photoCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		overflow: 'hidden',
		backgroundColor: '#1A1A1A',
		borderWidth: 3,
		borderColor: '#333333',
		marginBottom: 16
	},
	photoImage: {
		width: '100%',
		height: '100%'
	},
	photoPlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	changePhotoButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	changePhotoText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	formSection: {
		gap: 20
	},
	inputGroup: {
		gap: 8
	},
	label: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A'
	},
	inputDisabled: {
		backgroundColor: '#0A0A0A',
		opacity: 0.6
	},
	helperText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#666666',
		marginTop: 4
	},

	bottomButton: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 12
	},
	saveButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
