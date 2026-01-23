import { useAuth } from '@/context/AuthContext';
import {
	getDefaultPlans,
	getUserWorkoutPlan,
	setUserWorkoutPlan
} from '@/controllers/plansController';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function WorkoutPlanScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [defaultPlans, setDefaultPlans] = useState([]);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const [plan, plans] = await Promise.all([
					getUserWorkoutPlan(user.uid),
					Promise.resolve(getDefaultPlans())
				]);

				setSelectedPlan(plan);
				setDefaultPlans(plans);
			} catch (error) {
				console.error('Failed to load plans:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSelectPlan(planId) {
		if (!user?.uid) return;

		try {
			await setUserWorkoutPlan(user.uid, { selectedPlanId: planId });
			const updatedPlan = await getUserWorkoutPlan(user.uid);
			setSelectedPlan(updatedPlan);
			Alert.alert('Success', 'Workout plan updated');
		} catch (error) {
			console.error('Failed to save plan:', error);
			Alert.alert('Error', 'Failed to update workout plan');
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
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Workout Plan</Text>
					<Text style={styles.subtitle}>
						Choose a training split that fits your schedule
					</Text>
				</View>

				{/* Plan Options */}
				<View style={styles.planOptions}>
					{defaultPlans.map((plan) => (
						<TouchableOpacity
							key={plan.id}
							style={[
								styles.planOption,
								selectedPlan?.id === plan.id && styles.planOptionActive
							]}
							onPress={() => handleSelectPlan(plan.id)}
							activeOpacity={0.7}
						>
							<View style={styles.planHeader}>
								<View style={styles.planTitleRow}>
									<Ionicons
										name='barbell-outline'
										size={24}
										color={selectedPlan?.id === plan.id ? '#000000' : '#AFFF2B'}
									/>
									<Text
										style={[
											styles.planTitle,
											selectedPlan?.id === plan.id && styles.planTitleActive
										]}
									>
										{plan.title}
									</Text>
								</View>
								{selectedPlan?.id === plan.id && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</View>
							<Text
								style={[
									styles.planDescription,
									selectedPlan?.id === plan.id && styles.planDescriptionActive
								]}
							>
								{plan.description}
							</Text>
							<View style={styles.planMeta}>
								<Text
									style={[
										styles.planMetaText,
										selectedPlan?.id === plan.id && styles.planMetaTextActive
									]}
								>
									{Object.keys(plan.workouts).length} workouts per week
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Coming Soon */}
				<View style={styles.comingSoon}>
					<Ionicons name='sparkles-outline' size={32} color='#666666' />
					<Text style={styles.comingSoonTitle}>Custom Plans Coming Soon</Text>
					<Text style={styles.comingSoonText}>
						Build your own workout split tailored to your goals
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 40
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},

	header: {
		marginBottom: 24
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

	planOptions: {
		gap: 12
	},
	planOption: {
		padding: 20,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	planOptionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	planHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	planTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	planTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	planTitleActive: {
		color: '#000000'
	},
	planDescription: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		marginBottom: 12,
		lineHeight: 20
	},
	planDescriptionActive: {
		color: '#000000',
		opacity: 0.7
	},
	planMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	planMetaText: {
		fontSize: 12,
		fontWeight: '800',
		color: '#666666'
	},
	planMetaTextActive: {
		color: '#000000',
		opacity: 0.6
	},

	comingSoon: {
		marginTop: 24,
		padding: 24,
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center'
	},
	comingSoonTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 12,
		marginBottom: 8
	},
	comingSoonText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center'
	}
});
