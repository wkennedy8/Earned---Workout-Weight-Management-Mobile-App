import {
	ensureSignedIn,
	sendPhoneVerification,
	verifyPhoneCode
} from '@/lib/auth';
import { app } from '@/lib/firebase';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../constants/fonts';

// Format phone number to E.164 format (+1XXXXXXXXXX)
function formatToE164(phoneNumber) {
	// Remove all non-numeric characters
	const digits = phoneNumber.replace(/\D/g, '');

	// If starts with 1 and has 11 digits, add +
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}

	// If has 10 digits, assume US and add +1
	if (digits.length === 10) {
		return `+1${digits}`;
	}

	// If already starts with +, return as is
	if (phoneNumber.startsWith('+')) {
		return `+${digits}`;
	}

	// Otherwise return with + prefix
	return digits.length > 0 ? `+${digits}` : '';
}

// Format phone number for display (XXX) XXX-XXXX
function formatPhoneDisplay(phoneNumber) {
	const digits = phoneNumber.replace(/\D/g, '');

	if (digits.length === 0) return '';
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	if (digits.length <= 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
	}

	// Handle 11 digits (with country code 1)
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
	}

	return phoneNumber;
}

// Validate phone number
function isValidPhone(phoneNumber) {
	const digits = phoneNumber.replace(/\D/g, '');
	// Must be 10 digits (US) or 11 digits starting with 1
	return (
		digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
	);
}

export default function LoginScreen() {
	const router = useRouter();
	const [phoneNumber, setPhoneNumber] = useState('');
	const [displayPhone, setDisplayPhone] = useState('');
	const [verificationCode, setVerificationCode] = useState('');
	const [confirmationResult, setConfirmationResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [phoneError, setPhoneError] = useState('');
	const [tapCount, setTapCount] = useState(0);

	const recaptchaVerifier = useRef(null);

	// Admin login handler
	async function handleAdminLogin() {
		try {
			setLoading(true);
			await ensureSignedIn(); // Signs in anonymously as admin
			router.replace('/(tabs)');
		} catch (error) {
			console.error('Admin login error:', error);
			Alert.alert('Error', 'Failed to sign in as admin');
		} finally {
			setLoading(false);
		}
	}

	// Secret tap gesture handler
	function handleTitlePress() {
		const newCount = tapCount + 1;
		setTapCount(newCount);

		if (newCount >= 5) {
			setTapCount(0);
			Alert.alert('Admin Login', 'Sign in as admin user?', [
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Sign In', onPress: handleAdminLogin }
			]);
		}

		// Reset tap count after 2 seconds
		setTimeout(() => setTapCount(0), 2000);
	}

	function handlePhoneChange(text) {
		setPhoneError('');
		const formatted = formatPhoneDisplay(text);
		setDisplayPhone(formatted);
		setPhoneNumber(text);
	}

	function handlePhoneBlur() {
		// Validate and format when user stops typing
		if (!phoneNumber) return;

		if (!isValidPhone(phoneNumber)) {
			setPhoneError('Please enter a valid 10-digit phone number');
			return;
		}

		// Format to display format
		const formatted = formatPhoneDisplay(phoneNumber);
		setDisplayPhone(formatted);
	}

	async function handleSendCode() {
		if (!phoneNumber.trim()) {
			setPhoneError('Please enter your phone number');
			return;
		}

		if (!isValidPhone(phoneNumber)) {
			setPhoneError('Please enter a valid 10-digit phone number');
			return;
		}

		setLoading(true);
		setPhoneError('');

		Keyboard.dismiss();
		try {
			// Convert to E.164 format for Firebase
			const e164Phone = formatToE164(phoneNumber);
			console.log('Sending code to:', e164Phone);

			const confirmation = await sendPhoneVerification(
				e164Phone,
				recaptchaVerifier.current
			);
			setConfirmationResult(confirmation);
			Alert.alert('Success', `Verification code sent to ${displayPhone}`);
		} catch (error) {
			console.error('Send code error:', error);
			if (error.code === 'auth/invalid-phone-number') {
				setPhoneError('Invalid phone number format');
			} else if (error.code === 'auth/too-many-requests') {
				setPhoneError('Too many attempts. Please try again later.');
			} else {
				setPhoneError(error.message || 'Failed to send code');
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleVerifyCode() {
		if (!verificationCode.trim()) {
			Alert.alert('Error', 'Please enter the verification code');
			return;
		}

		if (verificationCode.length !== 6) {
			Alert.alert('Error', 'Verification code must be 6 digits');
			return;
		}

		setLoading(true);
		try {
			await verifyPhoneCode(confirmationResult, verificationCode);
			// User is now signed in, AuthContext will handle navigation
			Keyboard.dismiss();
		} catch (error) {
			console.error('Verify code error:', error);
			if (error.code === 'auth/invalid-verification-code') {
				Alert.alert('Error', 'Invalid verification code. Please try again.');
			} else if (error.code === 'auth/code-expired') {
				Alert.alert(
					'Error',
					'Verification code expired. Please request a new one.'
				);
				setConfirmationResult(null);
				setVerificationCode('');
			} else {
				Alert.alert('Error', 'Failed to verify code. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<SafeAreaView style={styles.safe}>
			<FirebaseRecaptchaVerifierModal
				ref={recaptchaVerifier}
				firebaseConfig={app.options}
				attemptInvisibleVerification={true}
			/>

			<View style={styles.container}>
				<TouchableOpacity
					onPress={handleTitlePress}
					activeOpacity={1}
					disabled={loading}
				>
					<Text style={styles.title}>Welcome</Text>
				</TouchableOpacity>
				<Text style={styles.subtitle}>
					Enter your phone number to get started
				</Text>

				{!confirmationResult ? (
					<>
						<View style={styles.inputWrapper}>
							<TextInput
								style={[styles.input, phoneError && styles.inputError]}
								placeholder='(555) 123-4567'
								placeholderTextColor='#666666'
								value={displayPhone}
								onChangeText={handlePhoneChange}
								onBlur={handlePhoneBlur}
								keyboardType='phone-pad'
								autoComplete='tel'
								maxLength={18} // Allows for formatted display
							/>
							{phoneError ? (
								<Text style={styles.errorText}>{phoneError}</Text>
							) : null}
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								!isValidPhone(phoneNumber) && styles.buttonDisabled
							]}
							onPress={handleSendCode}
							disabled={loading || !isValidPhone(phoneNumber)}
						>
							{loading ? (
								<ActivityIndicator color='#000000' />
							) : (
								<Text style={styles.buttonText}>Send Code</Text>
							)}
						</TouchableOpacity>
					</>
				) : (
					<>
						<Text style={styles.codeText}>
							Enter the 6-digit code sent to {displayPhone}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='000000'
							placeholderTextColor='#666666'
							value={verificationCode}
							onChangeText={(text) =>
								setVerificationCode(text.replace(/\D/g, ''))
							}
							keyboardType='number-pad'
							maxLength={6}
							autoFocus
						/>

						<TouchableOpacity
							style={[
								styles.button,
								verificationCode.length !== 6 && styles.buttonDisabled
							]}
							onPress={handleVerifyCode}
							disabled={loading || verificationCode.length !== 6}
						>
							{loading ? (
								<ActivityIndicator color='#000000' />
							) : (
								<Text style={styles.buttonText}>Verify Code</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.resendButton}
							onPress={() => {
								setConfirmationResult(null);
								setVerificationCode('');
							}}
							disabled={loading}
						>
							<Text style={styles.resendText}>Change Number</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: 'center'
	},
	title: {
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 32
	},
	codeText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 24,
		textAlign: 'center',
		lineHeight: 20
	},
	inputWrapper: {
		marginBottom: 8
	},
	input: {
		height: 56,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		paddingHorizontal: 16,
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A',
		marginBottom: 8
	},
	inputError: {
		borderColor: '#FF453A',
		borderWidth: 2
	},
	errorText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#FF453A',
		marginBottom: 8,
		marginLeft: 4
	},
	button: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8
	},
	buttonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	},
	resendButton: {
		marginTop: 16,
		alignItems: 'center'
	},
	resendText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#AFFF2B'
	}
});
