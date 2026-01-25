import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View
} from 'react-native';
import { FontFamily } from '../../constants/fonts';
import ProgressBar from './ProgressBar';

export default function WeightStep({
	onNext,
	onBack,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { data, updateData } = useOnboarding();
	const [weight, setWeight] = useState(data.currentWeight?.toString() || '');

	function handleContinue() {
		const weightNum = parseFloat(weight);

		if (!weight.trim() || isNaN(weightNum) || weightNum <= 0) {
			alert('Please enter a valid weight');
			return;
		}

		updateData('currentWeight', weightNum);
		onNext();
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
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
						<Text style={styles.title}>What's your current weight?</Text>
						<Text style={styles.subtitle}>
							This helps us track your progress over time
						</Text>
					</View>

					{/* Weight Input */}
					<View style={styles.inputWrapper}>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								value={weight}
								onChangeText={setWeight}
								placeholder='150'
								placeholderTextColor='#666666'
								keyboardType='decimal-pad'
								autoFocus
								// returnKeyType='done'
								onSubmitEditing={handleContinue}
								blurOnSubmit={true}
							/>
							<Text style={styles.inputUnit}>lbs</Text>
						</View>
						<Text style={styles.inputHint}>
							You can change units later in settings
						</Text>
					</View>
				</ScrollView>
			</TouchableWithoutFeedback>

			{/* Bottom Button */}
			<TouchableOpacity
				style={[styles.button, !weight.trim() && styles.buttonDisabled]}
				onPress={handleContinue}
				disabled={!weight.trim()}
				activeOpacity={0.9}
			>
				<Text style={styles.buttonText}>Continue</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 24,
		flexGrow: 1
	},

	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: -12,
		marginBottom: 12
	},

	header: {
		marginBottom: 48
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

	inputWrapper: {
		gap: 8,
		marginBottom: 24
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 72,
		borderWidth: 2,
		borderColor: '#333333',
		borderRadius: 16,
		paddingHorizontal: 20,
		backgroundColor: '#1A1A1A'
	},
	input: {
		flex: 1,
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		padding: 0
	},
	inputUnit: {
		fontSize: 20,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginLeft: 12
	},
	inputHint: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666666',
		marginLeft: 4
	},

	button: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		marginHorizontal: 24
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
