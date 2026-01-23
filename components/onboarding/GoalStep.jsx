import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../../constants/fonts';
import ProgressBar from './ProgressBar';

export default function GoalStep({
	onNext,
	onBack,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { data, updateData } = useOnboarding();
	const [goal, setGoal] = useState(data.goal);

	function handleContinue() {
		if (!goal) {
			alert('Please select a goal');
			return;
		}

		updateData('goal', goal);
		onNext();
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
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
					<Text style={styles.title}>What's your goal?</Text>
					<Text style={styles.subtitle}>
						This helps us personalize your experience
					</Text>
				</View>

				{/* Goal Options */}
				<View style={styles.goalOptions}>
					<TouchableOpacity
						style={[
							styles.goalOption,
							goal === 'lose' && styles.goalOptionActive
						]}
						onPress={() => setGoal('lose')}
						activeOpacity={0.7}
					>
						<View style={styles.goalIconContainer}>
							<Ionicons
								name='trending-down'
								size={32}
								color={goal === 'lose' ? '#000000' : '#AFFF2B'}
							/>
						</View>
						<View style={styles.goalContent}>
							<Text
								style={[
									styles.goalTitle,
									goal === 'lose' && styles.goalTitleActive
								]}
							>
								Lose Weight
							</Text>
							<Text
								style={[
									styles.goalDescription,
									goal === 'lose' && styles.goalDescriptionActive
								]}
							>
								Shed pounds and get lean
							</Text>
						</View>
						{goal === 'lose' && (
							<Ionicons name='checkmark-circle' size={24} color='#000000' />
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.goalOption,
							goal === 'maintain' && styles.goalOptionActive
						]}
						onPress={() => setGoal('maintain')}
						activeOpacity={0.7}
					>
						<View style={styles.goalIconContainer}>
							<Ionicons
								name='remove-outline'
								size={32}
								color={goal === 'maintain' ? '#000000' : '#AFFF2B'}
							/>
						</View>
						<View style={styles.goalContent}>
							<Text
								style={[
									styles.goalTitle,
									goal === 'maintain' && styles.goalTitleActive
								]}
							>
								Maintain Weight
							</Text>
							<Text
								style={[
									styles.goalDescription,
									goal === 'maintain' && styles.goalDescriptionActive
								]}
							>
								Stay at your current weight
							</Text>
						</View>
						{goal === 'maintain' && (
							<Ionicons name='checkmark-circle' size={24} color='#000000' />
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.goalOption,
							goal === 'gain' && styles.goalOptionActive
						]}
						onPress={() => setGoal('gain')}
						activeOpacity={0.7}
					>
						<View style={styles.goalIconContainer}>
							<Ionicons
								name='trending-up'
								size={32}
								color={goal === 'gain' ? '#000000' : '#AFFF2B'}
							/>
						</View>
						<View style={styles.goalContent}>
							<Text
								style={[
									styles.goalTitle,
									goal === 'gain' && styles.goalTitleActive
								]}
							>
								Gain Weight
							</Text>
							<Text
								style={[
									styles.goalDescription,
									goal === 'gain' && styles.goalDescriptionActive
								]}
							>
								Build muscle and strength
							</Text>
						</View>
						{goal === 'gain' && (
							<Ionicons name='checkmark-circle' size={24} color='#000000' />
						)}
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Bottom Button */}
			<TouchableOpacity
				style={[styles.button, !goal && styles.buttonDisabled]}
				onPress={handleContinue}
				disabled={!goal}
				activeOpacity={0.9}
			>
				<Text style={styles.buttonText}>Continue</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollView: { flex: 1 },
	content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },

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

	goalOptions: {
		gap: 12
	},
	goalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		padding: 20,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	goalOptionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	goalIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	goalContent: {
		flex: 1
	},
	goalTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	goalTitleActive: {
		color: '#000000'
	},
	goalDescription: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},
	goalDescriptionActive: {
		color: '#000000',
		opacity: 0.7
	},

	button: {
		position: 'absolute',
		bottom: 24,
		left: 24,
		right: 24,
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
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
