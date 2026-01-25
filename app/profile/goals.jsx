import { useAuth } from '@/context/AuthContext';
import { getProfile, upsertProfile } from '@/controllers/profileController';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

// Calculate macro nutrients based on weight and goal
function calculateMacros(weight, goal) {
	if (!weight) return { protein: 0, carbs: 0, fats: 0, totalCalories: 0 };

	// Base calories calculation
	let totalCalories = weight * 14.5;

	// Adjust for goal
	if (goal === 'lose') {
		totalCalories -= 250;
	} else if (goal === 'gain') {
		totalCalories += 250;
	}

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

export default function GoalsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [goal, setGoal] = useState(null);
	const [currentWeight, setCurrentWeight] = useState(null);
	const [macros, setMacros] = useState({
		protein: '',
		carbs: '',
		fats: ''
	});
	const [totalCalories, setTotalCalories] = useState(0);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const profile = await getProfile(user.uid);
				setGoal(profile?.goal || null);
				setCurrentWeight(profile?.currentWeight || null);

				// Set macros from profile or calculate defaults
				if (profile?.protein && profile?.carbs && profile?.fats) {
					setMacros({
						protein: profile.protein.toString(),
						carbs: profile.carbs.toString(),
						fats: profile.fats.toString()
					});
				} else if (profile?.currentWeight && profile?.goal) {
					const calculated = calculateMacros(
						profile.currentWeight,
						profile.goal
					);
					setMacros({
						protein: calculated.protein.toString(),
						carbs: calculated.carbs.toString(),
						fats: calculated.fats.toString()
					});
				}
			} catch (error) {
				console.error('Failed to load goal:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	// Recalculate total calories when macros change
	useEffect(() => {
		const protein = parseFloat(macros.protein) || 0;
		const carbs = parseFloat(macros.carbs) || 0;
		const fats = parseFloat(macros.fats) || 0;

		const total = protein * 4 + carbs * 4 + fats * 9;
		setTotalCalories(Math.round(total));
	}, [macros]);

	// Recalculate macros when goal changes
	function handleGoalChange(newGoal) {
		setGoal(newGoal);

		// Auto-recalculate macros if we have current weight
		if (currentWeight) {
			const calculated = calculateMacros(currentWeight, newGoal);
			setMacros({
				protein: calculated.protein.toString(),
				carbs: calculated.carbs.toString(),
				fats: calculated.fats.toString()
			});
		}
	}

	function handleResetMacros() {
		if (!currentWeight || !goal) {
			Alert.alert('Error', 'Cannot reset macros without weight and goal data');
			return;
		}

		const calculated = calculateMacros(currentWeight, goal);
		setMacros({
			protein: calculated.protein.toString(),
			carbs: calculated.carbs.toString(),
			fats: calculated.fats.toString()
		});
	}

	async function handleSave() {
		if (!user?.uid || !goal) return;

		const protein = parseFloat(macros.protein);
		const carbs = parseFloat(macros.carbs);
		const fats = parseFloat(macros.fats);

		if (isNaN(protein) || isNaN(carbs) || isNaN(fats)) {
			Alert.alert('Error', 'Please enter valid numbers for all macros');
			return;
		}

		if (protein <= 0 || carbs <= 0 || fats <= 0) {
			Alert.alert('Error', 'All macro values must be greater than 0');
			return;
		}

		setSaving(true);
		try {
			await upsertProfile(user.uid, {
				goal,
				protein: Math.round(protein),
				carbs: Math.round(carbs),
				fats: Math.round(fats)
			});
			Alert.alert('Success', 'Goal and macros updated');
			router.back();
		} catch (error) {
			console.error('Failed to save goal:', error);
			Alert.alert('Error', 'Failed to update goal');
		} finally {
			setSaving(false);
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
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.container}>
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					>
						{/* Header */}
						<View style={styles.header}>
							<Text style={styles.title}>Change Goals</Text>
							<Text style={styles.subtitle}>
								Update your fitness objective and macros
							</Text>
						</View>

						{/* Goal Options */}
						<View style={styles.section}>
							<Text style={[styles.sectionTitle, { marginBottom: 14 }]}>
								Fitness Goal
							</Text>
							<View style={styles.goalOptions}>
								<TouchableOpacity
									style={[
										styles.goalOption,
										goal === 'lose' && styles.goalOptionActive
									]}
									onPress={() => handleGoalChange('lose')}
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
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#000000'
										/>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.goalOption,
										goal === 'maintain' && styles.goalOptionActive
									]}
									onPress={() => handleGoalChange('maintain')}
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
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#000000'
										/>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.goalOption,
										goal === 'gain' && styles.goalOptionActive
									]}
									onPress={() => handleGoalChange('gain')}
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
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#000000'
										/>
									)}
								</TouchableOpacity>
							</View>
						</View>

						{/* Macros Section */}
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Daily Macros</Text>
								<TouchableOpacity
									style={styles.resetButton}
									onPress={handleResetMacros}
									activeOpacity={0.7}
								>
									<Ionicons name='refresh' size={14} color='#AFFF2B' />
									<Text style={styles.resetText}>Reset</Text>
								</TouchableOpacity>
							</View>

							{/* Total Calories */}
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
											<Ionicons name='fitness' size={18} color='#6366F1' />
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
											<Ionicons name='flame' size={18} color='#FBBF24' />
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
											<Ionicons name='water' size={18} color='#EF4444' />
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

							<Text style={styles.macroHint}>
								Macros are auto-calculated based on your weight and goal. Tap
								Reset to restore recommended values.
							</Text>
						</View>
					</ScrollView>

					{/* Save Button */}
					<View style={styles.bottomButton}>
						<TouchableOpacity
							style={[styles.saveButton, !goal && styles.saveButtonDisabled]}
							onPress={handleSave}
							disabled={saving || !goal}
							activeOpacity={0.9}
						>
							{saving ? (
								<ActivityIndicator color='#000000' />
							) : (
								<Text style={styles.saveButtonText}>Save Changes</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 100
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},

	header: {
		marginBottom: 32
	},
	title: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	section: {
		marginBottom: 32
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16
	},
	sectionTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
		// marginBottom: 10
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

	resetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.1)'
	},
	resetText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	caloriesCard: {
		backgroundColor: '#1A1A1A',
		borderWidth: 2,
		borderColor: '#AFFF2B',
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		marginBottom: 16
	},
	caloriesLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 8
	},
	caloriesValue: {
		fontSize: 40,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	caloriesUnit: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4
	},

	macrosContainer: {
		gap: 12,
		marginBottom: 12
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
		gap: 10,
		marginBottom: 10
	},
	macroIcon: {
		width: 32,
		height: 32,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center'
	},
	macroLabel: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	macroInputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6
	},
	macroInput: {
		flex: 1,
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		padding: 0
	},
	macroUnit: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginLeft: 10
	},
	macroCalories: {
		fontSize: 12,
		fontWeight: '700',
		color: '#666666'
	},

	macroHint: {
		fontSize: 12,
		fontWeight: '700',
		color: '#666666',
		textAlign: 'center',
		lineHeight: 16
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
	saveButtonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
