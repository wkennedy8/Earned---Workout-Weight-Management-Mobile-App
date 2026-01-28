import { PLAN } from '@/utils/workoutPlan';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../constants/fonts';

export default function SwapExerciseModal({
	visible,
	onClose,
	exercise,
	templateId, // ADD THIS PROP - need to know which workout template
	onSwap
}) {
	// Find alternatives from the original template
	const alternatives = useMemo(() => {
		if (!exercise || !templateId) return [];

		// Get the original exercise name (in case it was already swapped)
		const exerciseName = exercise.originalName || exercise.name;

		// Find the template exercise that matches
		for (const plan of Object.values(PLAN)) {
			if (plan.workouts) {
				for (const workout of Object.values(plan.workouts)) {
					if (workout.id === templateId) {
						// Found the right workout template
						const templateExercise = workout.exercises?.find(
							(ex) => ex.name === exerciseName
						);

						if (templateExercise && templateExercise.alternatives) {
							return templateExercise.alternatives;
						}
					}
				}
			}
		}

		return [];
	}, [exercise, templateId]);

	if (!exercise) return null;

	function handleSwap(alternative) {
		onSwap(alternative);
		onClose();
	}

	function getDifficultyColor(difficulty) {
		switch (difficulty) {
			case 'easier':
				return '#4ADE80'; // Green
			case 'harder':
				return '#F87171'; // Red
			case 'same':
			default:
				return '#FBBF24'; // Yellow
		}
	}

	function getDifficultyIcon(difficulty) {
		switch (difficulty) {
			case 'easier':
				return 'trending-down';
			case 'harder':
				return 'trending-up';
			case 'same':
			default:
				return 'remove';
		}
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.modalCard}>
					{/* Header */}
					<View style={styles.header}>
						<View>
							<Text style={styles.title}>Swap Exercise</Text>
							<Text style={styles.subtitle}>Choose an alternative</Text>
						</View>
						<TouchableOpacity
							onPress={onClose}
							style={styles.closeButton}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name='close' size={24} color='#999999' />
						</TouchableOpacity>
					</View>

					{/* Current Exercise */}
					<View style={styles.currentExercise}>
						<Text style={styles.currentLabel}>Current Exercise</Text>
						<View style={styles.currentCard}>
							<Ionicons name='fitness' size={20} color='#AFFF2B' />
							<Text style={styles.currentName}>{exercise.name}</Text>
						</View>
					</View>

					{/* Alternatives List */}
					<ScrollView
						style={styles.alternativesList}
						showsVerticalScrollIndicator={false}
					>
						{alternatives.length === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyText}>
									No alternatives available for this exercise
								</Text>
							</View>
						) : (
							alternatives.map((alt, index) => (
								<TouchableOpacity
									key={index}
									style={styles.alternativeCard}
									onPress={() => handleSwap(alt)}
									activeOpacity={0.7}
								>
									<View style={styles.alternativeLeft}>
										<Ionicons
											name='swap-horizontal'
											size={18}
											color='#666666'
										/>
										<Text style={styles.alternativeName}>{alt.name}</Text>
									</View>

									<View
										style={[
											styles.difficultyBadge,
											{
												backgroundColor: `${getDifficultyColor(alt.difficulty)}20`
											}
										]}
									>
										<Ionicons
											name={getDifficultyIcon(alt.difficulty)}
											size={12}
											color={getDifficultyColor(alt.difficulty)}
										/>
										<Text
											style={[
												styles.difficultyText,
												{ color: getDifficultyColor(alt.difficulty) }
											]}
										>
											{alt.difficulty}
										</Text>
									</View>
								</TouchableOpacity>
							))
						)}
					</ScrollView>

					{/* Info Footer */}
					<View style={styles.footer}>
						<Ionicons name='information-circle' size={16} color='#666666' />
						<Text style={styles.footerText}>
							This swap is for this session only
						</Text>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
		justifyContent: 'flex-end'
	},
	modalCard: {
		backgroundColor: '#1A1A1A',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 24,
		paddingBottom: 40,
		paddingHorizontal: 20,
		maxHeight: '80%',
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: '#333333'
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 20
	},
	title: {
		fontSize: 24,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	subtitle: {
		fontSize: 14,
		fontFamily: FontFamily.bold,
		color: '#666666'
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},

	currentExercise: {
		marginBottom: 20
	},
	currentLabel: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	currentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		borderWidth: 1,
		borderColor: '#AFFF2B',
		borderRadius: 12,
		padding: 14
	},
	currentName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		flex: 1
	},

	alternativesList: {
		maxHeight: 400
	},
	alternativeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 14,
		marginBottom: 10
	},
	alternativeLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	alternativeName: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		flex: 1
	},

	difficultyBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8
	},
	difficultyText: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		textTransform: 'capitalize'
	},

	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40
	},
	emptyText: {
		fontSize: 14,
		fontFamily: FontFamily.bold,
		color: '#666666',
		textAlign: 'center'
	},

	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#333333'
	},
	footerText: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#666666',
		flex: 1
	}
});
