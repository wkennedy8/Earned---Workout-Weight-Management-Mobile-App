import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
	Keyboard,
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

// Calculate macro nutrients based on weight and goal
function calculateMacros(weight, goal) {
	// Base calories calculation
	let totalCalories = weight * 14.5;

	// Adjust for goal
	if (goal === 'lose') {
		totalCalories -= 500;
	} else if (goal === 'gain') {
		totalCalories += 250;
	}
	// maintain stays the same

	// Protein: 1g per lb of body weight
	const proteinGrams = weight * 1;
	const proteinCalories = proteinGrams * 4;

	// Fats: 0.35g per lb of body weight
	const fatsGrams = weight * 0.35;
	const fatsCalories = fatsGrams * 9;

	// Carbs: remaining calories divided by 4
	const carbsCalories = totalCalories - proteinCalories - fatsCalories;
	const carbsGrams = carbsCalories / 4;

	return {
		protein: Math.round(proteinGrams),
		carbs: Math.round(carbsGrams),
		fats: Math.round(fatsGrams),
		totalCalories: Math.round(totalCalories)
	};
}

export default function MacrosStep({
	onNext,
	onBack,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { data, updateData } = useOnboarding();

	// Calculate initial values based on weight and goal
	const [macros, setMacros] = useState(() => {
		if (data.protein && data.carbs && data.fats) {
			return {
				protein: data.protein.toString(),
				carbs: data.carbs.toString(),
				fats: data.fats.toString()
			};
		}

		const calculated = calculateMacros(data.currentWeight, data.goal);
		return {
			protein: calculated.protein.toString(),
			carbs: calculated.carbs.toString(),
			fats: calculated.fats.toString()
		};
	});

	const [totalCalories, setTotalCalories] = useState(() => {
		const calculated = calculateMacros(data.currentWeight, data.goal);
		return calculated.totalCalories;
	});

	// Recalculate total calories when macros change
	useEffect(() => {
		const protein = parseFloat(macros.protein) || 0;
		const carbs = parseFloat(macros.carbs) || 0;
		const fats = parseFloat(macros.fats) || 0;

		const total = protein * 4 + carbs * 4 + fats * 9;
		setTotalCalories(Math.round(total));
	}, [macros]);

	function handleContinue() {
		const protein = parseFloat(macros.protein);
		const carbs = parseFloat(macros.carbs);
		const fats = parseFloat(macros.fats);

		if (isNaN(protein) || isNaN(carbs) || isNaN(fats)) {
			alert('Please enter valid numbers for all macros');
			return;
		}

		if (protein <= 0 || carbs <= 0 || fats <= 0) {
			alert('All macro values must be greater than 0');
			return;
		}

		updateData('protein', Math.round(protein));
		updateData('carbs', Math.round(carbs));
		updateData('fats', Math.round(fats));
		onNext();
	}

	function handleReset() {
		const calculated = calculateMacros(data.currentWeight, data.goal);
		setMacros({
			protein: calculated.protein.toString(),
			carbs: calculated.carbs.toString(),
			fats: calculated.fats.toString()
		});
	}

	return (
		<View style={styles.container}>
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
						<Text style={styles.title}>Set your macros</Text>
						<Text style={styles.subtitle}>
							Based on your {data.currentWeight}lbs and{' '}
							{data.goal === 'lose'
								? 'weight loss'
								: data.goal === 'gain'
									? 'muscle gain'
									: 'maintenance'}{' '}
							goal
						</Text>
					</View>

					{/* Total Calories Card */}
					<View style={styles.caloriesCard}>
						<Text style={styles.caloriesLabel}>Daily Target</Text>
						<Text style={styles.caloriesValue}>
							{totalCalories.toLocaleString()}
						</Text>
						<Text style={styles.caloriesUnit}>calories</Text>
					</View>

					{/* Macro Inputs */}
					<View style={styles.macrosContainer}>
						{/* Protein */}
						<View style={styles.macroCard}>
							<View style={styles.macroHeader}>
								<View
									style={[
										styles.macroIcon,
										{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }
									]}
								>
									<Ionicons name='fitness' size={20} color='#6366F1' />
								</View>
								<Text style={styles.macroLabel}>Protein</Text>
							</View>
							<View style={styles.macroInputRow}>
								<TextInput
									style={styles.macroInput}
									value={macros.protein}
									onChangeText={(text) =>
										setMacros((prev) => ({ ...prev, protein: text }))
									}
									placeholder='0'
									placeholderTextColor='#666666'
									keyboardType='decimal-pad'
									returnKeyType='done'
									blurOnSubmit={true}
								/>
								<Text style={styles.macroUnit}>g</Text>
							</View>
							<Text style={styles.macroCalories}>
								{Math.round(parseFloat(macros.protein || 0) * 4)} cal
							</Text>
						</View>

						{/* Carbs */}
						<View style={styles.macroCard}>
							<View style={styles.macroHeader}>
								<View
									style={[
										styles.macroIcon,
										{ backgroundColor: 'rgba(251, 191, 36, 0.15)' }
									]}
								>
									<Ionicons name='flame' size={20} color='#FBBF24' />
								</View>
								<Text style={styles.macroLabel}>Carbs</Text>
							</View>
							<View style={styles.macroInputRow}>
								<TextInput
									style={styles.macroInput}
									value={macros.carbs}
									onChangeText={(text) =>
										setMacros((prev) => ({ ...prev, carbs: text }))
									}
									placeholder='0'
									placeholderTextColor='#666666'
									keyboardType='decimal-pad'
									returnKeyType='done'
									blurOnSubmit={true}
								/>
								<Text style={styles.macroUnit}>g</Text>
							</View>
							<Text style={styles.macroCalories}>
								{Math.round(parseFloat(macros.carbs || 0) * 4)} cal
							</Text>
						</View>

						{/* Fats */}
						<View style={styles.macroCard}>
							<View style={styles.macroHeader}>
								<View
									style={[
										styles.macroIcon,
										{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }
									]}
								>
									<Ionicons name='water' size={20} color='#EF4444' />
								</View>
								<Text style={styles.macroLabel}>Fats</Text>
							</View>
							<View style={styles.macroInputRow}>
								<TextInput
									style={styles.macroInput}
									value={macros.fats}
									onChangeText={(text) =>
										setMacros((prev) => ({ ...prev, fats: text }))
									}
									placeholder='0'
									placeholderTextColor='#666666'
									keyboardType='decimal-pad'
									returnKeyType='done'
									blurOnSubmit={true}
								/>
								<Text style={styles.macroUnit}>g</Text>
							</View>
							<Text style={styles.macroCalories}>
								{Math.round(parseFloat(macros.fats || 0) * 9)} cal
							</Text>
						</View>
					</View>

					{/* Reset Button */}
					<TouchableOpacity
						style={styles.resetButton}
						onPress={handleReset}
						activeOpacity={0.7}
					>
						<Ionicons name='refresh' size={16} color='#AFFF2B' />
						<Text style={styles.resetText}>Reset to recommended</Text>
					</TouchableOpacity>

					{/* Info Text */}
					<Text style={styles.infoText}>
						These values are calculated based on your weight and goal. You can
						adjust them now or change them later in settings.
					</Text>
				</ScrollView>
			</TouchableWithoutFeedback>

			{/* Bottom Button */}
			<TouchableOpacity
				style={styles.button}
				onPress={handleContinue}
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
		marginBottom: 24
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

	caloriesCard: {
		backgroundColor: '#1A1A1A',
		borderWidth: 2,
		borderColor: '#AFFF2B',
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		marginBottom: 24
	},
	caloriesLabel: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 8
	},
	caloriesValue: {
		fontSize: 48,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	caloriesUnit: {
		fontSize: 16,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4
	},

	macrosContainer: {
		gap: 12,
		marginBottom: 20
	},
	macroCard: {
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		padding: 16
	},
	macroHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 12
	},
	macroIcon: {
		width: 36,
		height: 36,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	macroLabel: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	macroInputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8
	},
	macroInput: {
		flex: 1,
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		padding: 0
	},
	macroUnit: {
		fontSize: 20,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginLeft: 12
	},
	macroCalories: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666666'
	},

	resetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 12,
		marginBottom: 16
	},
	resetText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	infoText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666666',
		textAlign: 'center',
		lineHeight: 18,
		marginBottom: 24
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
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
