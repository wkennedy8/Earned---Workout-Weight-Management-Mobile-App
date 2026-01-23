import { useOnboarding } from '@/context/OnboardingContext';
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

export default function NameStep({ onNext, currentStep, totalSteps }) {
	const { data, updateData } = useOnboarding();
	const [name, setName] = useState(data.name);

	function handleContinue() {
		if (!name.trim()) {
			alert('Please enter your name');
			return;
		}

		updateData('name', name.trim());
		onNext();
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<View style={styles.content}>
				{/* Progress */}
				<ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>What's your name?</Text>
					<Text style={styles.subtitle}>Let's get to know you better</Text>
				</View>

				{/* Input */}
				<TextInput
					style={styles.input}
					placeholder='Enter your name'
					placeholderTextColor='#666666'
					value={name}
					onChangeText={setName}
					autoFocus
					autoCapitalize='words'
					returnKeyType='next'
					onSubmitEditing={handleContinue}
				/>
			</View>

			{/* Bottom Button */}
			<TouchableOpacity
				style={[styles.button, !name.trim() && styles.buttonDisabled]}
				onPress={handleContinue}
				disabled={!name.trim()}
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
