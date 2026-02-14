import { FontFamily } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExerciseHeader({
	exercise,
	exerciseIndex,
	expanded,
	completed,
	onToggle,
	onOpenSwap
}) {
	return (
		<TouchableOpacity
			activeOpacity={0.85}
			onPress={onToggle}
			style={styles.accordionHeader}
		>
			<View style={styles.exerciseHeaderLeft}>
				<View style={styles.exerciseIcon}>
					<Text style={styles.exerciseIconText}>🏋️</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text style={styles.exerciseName}>{exercise.name}</Text>
					{/* Show if swapped */}
					{exercise.isSwapped && (
						<Text style={styles.swappedBadge}>
							Swapped from {exercise.originalName}
						</Text>
					)}
					<Text style={styles.exerciseMeta}>
						{exercise.targetSets} sets, {exercise.targetReps}{' '}
						{String(exercise.targetReps).toLowerCase() === 'time' ? '' : 'reps'}
						{exercise.note ? ` • ${exercise.note}` : ''}
					</Text>

					<Text
						style={[
							styles.exerciseStatus,
							completed && styles.exerciseStatusDone
						]}
					>
						{completed ? 'Completed' : 'In progress'}
					</Text>
				</View>
			</View>

			<View style={styles.exerciseHeaderRight}>
				{/* Swap Button */}
				<TouchableOpacity
					style={styles.swapButton}
					onPress={(e) => {
						e.stopPropagation();
						onOpenSwap(exerciseIndex);
					}}
					activeOpacity={0.7}
				>
					<Ionicons name='swap-horizontal' size={18} color='#AFFF2B' />
				</TouchableOpacity>

				<Text style={styles.chevron}>{expanded ? '˅' : '›'}</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	accordionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	exerciseHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	exerciseIcon: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseIconText: { fontSize: 16 },
	exerciseName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	exerciseMeta: {
		fontSize: 12,
		color: '#999999',
		marginTop: 2
	},
	exerciseStatus: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: '900',
		color: '#FFD60A'
	},
	exerciseStatusDone: { color: '#AFFF2B' },
	exerciseHeaderRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	swapButton: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		borderWidth: 1,
		borderColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	swappedBadge: {
		fontSize: 11,
		fontFamily: FontFamily.bold,
		color: '#FBBF24',
		marginTop: 2,
		marginBottom: 2
	},
	chevron: {
		fontSize: 22,
		fontWeight: '900',
		color: '#666666',
		marginLeft: 10
	}
});
