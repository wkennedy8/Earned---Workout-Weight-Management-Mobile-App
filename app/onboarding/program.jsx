import { useOnboarding } from '@/context/OnboardingContext';
import { getDefaultPlans } from '@/controllers/plansController';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function ProgramScreen() {
	const router = useRouter();
	const { data, updateData } = useOnboarding();
	const [selectedPlanId, setSelectedPlanId] = useState(data.selectedPlanId);
	const plans = getDefaultPlans();

	function handleContinue() {
		if (!selectedPlanId) {
			alert('Please select a program');
			return;
		}

		updateData('selectedPlanId', selectedPlanId);
		router.push('/onboarding/photo');
	}

	function handleBack() {
		router.back();
	}

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Back Button */}
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>

					{/* Progress */}
					<View style={styles.progressBar}>
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={styles.progressSegment} />
					</View>

					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Choose your program</Text>
						<Text style={styles.subtitle}>
							Select a workout split that fits your schedule
						</Text>
					</View>

					{/* Program Options */}
					<View style={styles.programOptions}>
						{plans.map((plan) => (
							<TouchableOpacity
								key={plan.id}
								style={[
									styles.programOption,
									selectedPlanId === plan.id && styles.programOptionActive
								]}
								onPress={() => setSelectedPlanId(plan.id)}
								activeOpacity={0.7}
							>
								<View style={styles.programHeader}>
									<View style={styles.programTitleRow}>
										<Ionicons
											name='barbell-outline'
											size={24}
											color={selectedPlanId === plan.id ? '#000000' : '#AFFF2B'}
										/>
										<Text
											style={[
												styles.programTitle,
												selectedPlanId === plan.id && styles.programTitleActive
											]}
										>
											{plan.title}
										</Text>
									</View>
									{selectedPlanId === plan.id && (
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#000000'
										/>
									)}
								</View>
								<Text
									style={[
										styles.programDescription,
										selectedPlanId === plan.id &&
											styles.programDescriptionActive
									]}
								>
									{plan.description}
								</Text>
								<View style={styles.programMeta}>
									<Text
										style={[
											styles.programMetaText,
											selectedPlanId === plan.id && styles.programMetaTextActive
										]}
									>
										{Object.keys(plan.workouts).length} workouts per week
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>

				{/* Bottom Button */}
				<TouchableOpacity
					style={[styles.button, !selectedPlanId && styles.buttonDisabled]}
					onPress={handleContinue}
					disabled={!selectedPlanId}
					activeOpacity={0.9}
				>
					<Text style={styles.buttonText}>Continue</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
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

	programOptions: {
		gap: 12
	},
	programOption: {
		padding: 20,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	programOptionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	programHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	programTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	programTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	programTitleActive: {
		color: '#000000'
	},
	programDescription: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 12,
		lineHeight: 20
	},
	programDescriptionActive: {
		color: '#000000',
		opacity: 0.7
	},
	programMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	programMetaText: {
		fontSize: 12,
		fontWeight: '800',
		color: '#666666'
	},
	programMetaTextActive: {
		color: '#000000',
		opacity: 0.6
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
