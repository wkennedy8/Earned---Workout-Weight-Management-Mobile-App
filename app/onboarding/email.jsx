import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

function isValidEmail(email) {
	if (!email) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export default function EmailScreen() {
	const router = useRouter();
	const { data, updateData } = useOnboarding();
	const [email, setEmail] = useState(data.email);

	function handleContinue() {
		if (!isValidEmail(email)) {
			alert('Please enter a valid email address');
			return;
		}

		updateData('email', email.trim());
		router.push('/onboarding/goal');
	}

	function handleBack() {
		router.back();
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				<View style={styles.content}>
					{/* Back Button */}
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>

					{/* Progress */}
					<View style={styles.progressBar}>
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={styles.progressSegment} />
						<View style={styles.progressSegment} />
						<View style={styles.progressSegment} />
					</View>

					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>What's your email?</Text>
						<Text style={styles.subtitle}>
							We'll use this to keep you updated
						</Text>
					</View>

					{/* Input */}
					<TextInput
						style={styles.input}
						placeholder='Enter your email'
						placeholderTextColor='#666666'
						value={email}
						onChangeText={setEmail}
						autoFocus
						keyboardType='email-address'
						autoCapitalize='none'
						autoCorrect={false}
						returnKeyType='next'
						onSubmitEditing={handleContinue}
					/>
				</View>

				{/* Bottom Button */}
				<TouchableOpacity
					style={[styles.button, !isValidEmail(email) && styles.buttonDisabled]}
					onPress={handleContinue}
					disabled={!isValidEmail(email)}
					activeOpacity={0.9}
				>
					<Text style={styles.buttonText}>Continue</Text>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1, paddingHorizontal: 24 },
	content: { flex: 1, paddingTop: 20 },

	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: -12,
		marginBottom: 12
	},

	progressBar: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 40
	},
	progressSegment: {
		flex: 1,
		height: 4,
		borderRadius: 2,
		backgroundColor: '#333333'
	},
	progressActive: {
		backgroundColor: '#AFFF2B'
	},

	header: {
		marginBottom: 32
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
		color: '#999999'
	},

	input: {
		height: 56,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		paddingHorizontal: 16,
		fontSize: 18,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A'
	},

	button: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24
	},
	buttonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
