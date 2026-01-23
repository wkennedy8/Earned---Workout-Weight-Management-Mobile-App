import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
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
import { FontFamily } from '../../constants/fonts';
import ProgressBar from './ProgressBar';

function isValidEmail(email) {
	if (!email) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export default function EmailStep({
	onNext,
	onBack,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { data, updateData } = useOnboarding();
	const [email, setEmail] = useState(data.email);

	function handleContinue() {
		if (!isValidEmail(email)) {
			alert('Please enter a valid email address');
			return;
		}

		updateData('email', email.trim());
		onNext();
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<View style={styles.content}>
				{/* Back Button */}
				{canGoBack && (
					<TouchableOpacity style={styles.backButton} onPress={onBack}>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>
				)}

				{/* Progress */}
				<ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

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
	);
}

const styles = StyleSheet.create({
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
