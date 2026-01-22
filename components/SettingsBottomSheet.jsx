import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Keyboard,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
	if (!email) return true;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export default function SettingsBottomSheet({ visible, onClose }) {
	const { user } = useAuth();
	const bottomSheetRef = useRef(null);

	// State for settings
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const [reminderTime, setReminderTime] = useState('20:00');
	const [showTimePicker, setShowTimePicker] = useState(false);

	// Snap points for bottom sheet
	const snapPoints = ['98%'];

	// Load settings when modal becomes visible
	useEffect(() => {
		if (!visible) return;

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
				setPhone(formatPhoneNumber(settings.phone));
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
	}, [visible, user?.uid]);

	// Handle bottom sheet close
	const handleSheetChanges = useCallback(
		(index) => {
			if (index === -1) {
				onClose();
			}
		},
		[onClose]
	);

	// Save settings to Firebase
	async function onSaveSettings() {
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
				phone: cleanPhoneNumber(phone),
				reminderEnabled,
				reminderTime
			});

			Alert.alert('Saved', 'Your settings have been updated.');
		} catch (e) {
			console.warn('Failed to save settings:', e);
			Alert.alert('Error', 'Failed to save settings. Please try again.');
		}
	}

	const timeOptions = getTimePickerOptions();

	if (!visible) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<GestureHandlerRootView style={styles.container}>
				<View style={styles.backdrop}>
					<TouchableOpacity
						style={styles.backdropTouchable}
						activeOpacity={1}
						onPress={onClose}
					/>
				</View>

				<BottomSheet
					ref={bottomSheetRef}
					index={0}
					snapPoints={snapPoints}
					onChange={handleSheetChanges}
					enablePanDownToClose={true}
					enableOverDrag={false}
					overDragResistanceFactor={0}
					enableContentPanningGesture={false}
					backgroundStyle={styles.bottomSheetBackground}
					handleIndicatorStyle={styles.handleIndicator}
					handleComponent={null}
				>
					<BottomSheetScrollView
						contentContainerStyle={styles.contentContainer}
						showsVerticalScrollIndicator={false}
					>
						{loading ? (
							<View style={styles.loadingWrap}>
								<Text style={styles.loadingText}>Loading settings…</Text>
							</View>
						) : (
							<>
								{/* Header */}
								<View style={styles.header}>
									<Text style={styles.title}>Settings</Text>
									<TouchableOpacity
										onPress={onClose}
										style={styles.closeButton}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Text style={styles.closeButtonText}>✕</Text>
									</TouchableOpacity>
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

									<View style={styles.toggleRow}>
										<View style={{ flex: 1 }}>
											<Text style={styles.toggleLabel}>
												Daily Photo Reminder
											</Text>
											<Text style={styles.toggleSubtext}>
												Receive a daily reminder to upload a progress photo
											</Text>
										</View>
										<TouchableOpacity
											style={[
												styles.toggle,
												reminderEnabled && styles.toggleActive
											]}
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
													<BottomSheetScrollView style={styles.pickerScroll}>
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
													</BottomSheetScrollView>
												</View>
											)}
										</View>
									)}
								</View>
							</>
						)}
					</BottomSheetScrollView>
				</BottomSheet>
			</GestureHandlerRootView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
	},
	backdropTouchable: {
		flex: 1
	},
	bottomSheetBackground: {
		backgroundColor: '#1A1A1A', // Lighter black (matches cards)
		borderTopLeftRadius: 24, // More rounded
		borderTopRightRadius: 24
	},
	handleIndicator: {
		backgroundColor: '#666666',
		width: 40
	},
	contentContainer: {
		paddingHorizontal: 18,
		paddingBottom: 40
	},
	loadingWrap: {
		paddingVertical: 40,
		alignItems: 'center'
	},
	loadingText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	header: {
		paddingVertical: 16,
		alignItems: 'center',
		position: 'relative' // Add this
	},
	closeButton: {
		position: 'absolute',
		right: 0,
		top: 16,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	closeButtonText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#999999'
	},
	title: {
		fontSize: 20,
		fontWeight: '900',
		color: '#AFFF2B'
	},

	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '900',
		color: '#AFFF2B'
	},
	sectionSubtitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 6,
		lineHeight: 18
	},

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

	saveButton: {
		marginTop: 16,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: {
		color: '#000000',
		fontSize: 16,
		fontWeight: '900'
	},

	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 14,
		paddingVertical: 8
	},
	toggleLabel: {
		fontSize: 15,
		fontWeight: '900',
		color: '#FFFFFF'
	},
	toggleSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		lineHeight: 16
	},
	toggle: {
		width: 52,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#333333',
		padding: 2,
		justifyContent: 'center'
	},
	toggleActive: {
		backgroundColor: '#AFFF2B'
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
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D'
	},
	pickerButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF'
	},
	pickerChevron: {
		fontSize: 18,
		fontWeight: '900',
		color: '#666666'
	},

	pickerDropdown: {
		marginTop: 8,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		backgroundColor: '#0D0D0D',
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
		borderBottomColor: '#1A1A1A'
	},
	pickerOptionActive: {
		backgroundColor: 'rgba(175, 255, 43, 0.1)'
	},
	pickerOptionText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#999999'
	},
	pickerOptionTextActive: {
		color: '#AFFF2B',
		fontWeight: '900'
	}
});
