import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	Alert,
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

import { useAuth } from '@/context/AuthContext';
import {
	getUserSettings,
	updateUserSettings
} from '@/controllers/profileController';
import { format12Hour, getTimePickerOptions } from '@/utils/dateUtils';
import {
	cleanPhoneNumber,
	formatPhoneNumber,
	isValidPhoneNumber
} from '@/utils/numberUtils';

// Email validation helper
function isValidEmail(email) {
	if (!email) return true; // Empty is valid (optional field)
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export default function SettingsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	// State for settings
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const [reminderTime, setReminderTime] = useState('20:00');
	const [showTimePicker, setShowTimePicker] = useState(false);

	// Load settings from Firebase
	useEffect(() => {
		let isMounted = true;

		(async () => {
			try {
				if (!user?.uid) {
					setLoading(false);
					return;
				}

				const settings = await getUserSettings(user.uid);

				if (!isMounted) return;

				setName(settings.name);
				setEmail(settings.email);
				setPhone(formatPhoneNumber(settings.phone)); // Format for display
				setReminderEnabled(settings.reminderEnabled);
				setReminderTime(settings.reminderTime);
			} catch (e) {
				console.warn('Failed to load settings:', e);
				Alert.alert('Error', 'Failed to load settings. Please try again.');
			} finally {
				if (isMounted) setLoading(false);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [user?.uid]);

	// Save settings to Firebase
	async function onSaveSettings() {
		if (!user?.uid) return;

		Keyboard.dismiss();

		// Validate email
		if (!isValidEmail(email)) {
			Alert.alert('Invalid Email', 'Please enter a valid email address.');
			return;
		}

		// Validate phone
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
				phone: cleanPhoneNumber(phone), // Store without formatting
				reminderEnabled,
				reminderTime
			});

			Alert.alert('Saved', 'Your settings have been updated.');
		} catch (e) {
			console.warn('Failed to save settings:', e);
			Alert.alert('Error', 'Failed to save settings. Please try again.');
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<Text style={styles.loadingText}>Loading settings…</Text>
				</View>
			</SafeAreaView>
		);
	}

	const timeOptions = getTimePickerOptions();

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
					{/* Header */}
					<View style={styles.headerRow}>
						<TouchableOpacity
							onPress={() => router.back()}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Text style={styles.backChevron}>‹</Text>
						</TouchableOpacity>

						<Text style={styles.title}>Settings</Text>

						<View style={{ width: 32 }} />
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
								placeholderTextColor='#9CA3AF'
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
								placeholderTextColor='#9CA3AF'
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
								placeholderTextColor='#9CA3AF'
								style={styles.textInput}
								keyboardType='phone-pad'
								maxLength={14}
							/>
						</View>

						<TouchableOpacity
							style={styles.saveButton}
							onPress={onSaveSettings}
							activeOpacity={0.9}
						>
							<Text style={styles.saveButtonText}>Save Changes</Text>
						</TouchableOpacity>
					</View>

					{/* Notification Settings */}
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Notifications</Text>
						<Text style={styles.sectionSubtitle}>
							Get reminded to track your progress
						</Text>

						{/* Toggle */}
						<View style={styles.toggleRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.toggleLabel}>Daily Photo Reminder</Text>
								<Text style={styles.toggleSubtext}>
									Receive a daily reminder to upload a progress photo
								</Text>
							</View>
							<TouchableOpacity
								style={[styles.toggle, reminderEnabled && styles.toggleActive]}
								onPress={() => setReminderEnabled(!reminderEnabled)}
								activeOpacity={0.8}
							>
								<View
									style={[
										styles.toggleThumb,
										reminderEnabled && styles.toggleThumbActive
									]}
								/>
							</TouchableOpacity>
						</View>

						{/* Time Picker */}
						{reminderEnabled && (
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>Reminder Time</Text>
								<TouchableOpacity
									style={styles.pickerButton}
									onPress={() => setShowTimePicker(!showTimePicker)}
									activeOpacity={0.8}
								>
									<Text style={styles.pickerButtonText}>
										{format12Hour(reminderTime)}
									</Text>
									<Text style={styles.pickerChevron}>
										{showTimePicker ? '˄' : '˅'}
									</Text>
								</TouchableOpacity>

								{showTimePicker && (
									<View style={styles.pickerDropdown}>
										<ScrollView style={styles.pickerScroll}>
											{timeOptions.map((option) => (
												<TouchableOpacity
													key={option.value}
													style={[
														styles.pickerOption,
														reminderTime === option.value &&
															styles.pickerOptionActive
													]}
													onPress={() => {
														setReminderTime(option.value);
														setShowTimePicker(false);
														onSaveSettings();
													}}
													activeOpacity={0.7}
												>
													<Text
														style={[
															styles.pickerOptionText,
															reminderTime === option.value &&
																styles.pickerOptionTextActive
														]}
													>
														{option.label}
													</Text>
												</TouchableOpacity>
											))}
										</ScrollView>
									</View>
								)}
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FFFFFF' },

	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 20,
		gap: 12
	},

	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },

	headerRow: {
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
	title: { fontSize: 18, fontWeight: '900', color: '#0B1220' },

	card: {
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 14
	},
	sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
	sectionSubtitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		marginTop: 6,
		lineHeight: 18
	},

	fieldGroup: { marginTop: 14 },
	fieldLabel: {
		fontSize: 12,
		fontWeight: '800',
		color: '#6B7280',
		marginBottom: 8
	},
	textInput: {
		height: 48,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 12,
		paddingHorizontal: 14,
		fontSize: 16,
		fontWeight: '700',
		color: '#0B1220',
		backgroundColor: '#FFFFFF'
	},

	saveButton: {
		marginTop: 16,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#1E66F5',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },

	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 14,
		paddingVertical: 8
	},
	toggleLabel: { fontSize: 15, fontWeight: '900', color: '#0B1220' },
	toggleSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#6B7280',
		marginTop: 4,
		lineHeight: 16
	},
	toggle: {
		width: 52,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#E5E7EB',
		padding: 2,
		justifyContent: 'center'
	},
	toggleActive: {
		backgroundColor: '#1E66F5'
	},
	toggleThumb: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 1 },
		elevation: 2
	},
	toggleThumbActive: {
		transform: [{ translateX: 20 }]
	},

	pickerButton: {
		height: 48,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 12,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#FFFFFF'
	},
	pickerButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0B1220'
	},
	pickerChevron: {
		fontSize: 18,
		fontWeight: '900',
		color: '#9CA3AF'
	},

	pickerDropdown: {
		marginTop: 8,
		borderWidth: 1,
		borderColor: '#E7EDF6',
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		maxHeight: 240,
		overflow: 'hidden'
	},
	pickerScroll: {
		flex: 1
	},
	pickerOption: {
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6'
	},
	pickerOptionActive: {
		backgroundColor: '#EFF6FF'
	},
	pickerOptionText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#374151'
	},
	pickerOptionTextActive: {
		color: '#1E66F5',
		fontWeight: '900'
	}
});
