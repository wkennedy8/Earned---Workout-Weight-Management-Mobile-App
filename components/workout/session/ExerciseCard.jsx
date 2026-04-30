import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FontFamily } from '../../../constants/fonts'
import ExerciseHeader from './ExerciseHeader'
import SetTable from './SetTable'

export default function ExerciseCard({
	exercise,
	exerciseIndex,
	isCompleted,
	onToggleExpanded,
	onOpenSwap,
	removeExercise,
	updateSetField,
	saveSet,
	removeSet,
	editSet,
	addSet,
	normalizeNumberText,
	getPreviousSet,
	weightSuggestion,
	onAcknowledgeSuggestion
}) {
	return (
		<View style={styles.exerciseCard}>
			<ExerciseHeader
				exercise={exercise}
				exerciseIndex={exerciseIndex}
				expanded={exercise.expanded}
				completed={isCompleted}
				onToggle={() => onToggleExpanded(exerciseIndex)}
				onOpenSwap={onOpenSwap}
				removeExercise={removeExercise}
			/>

			{exercise.expanded && weightSuggestion && (
				<View style={styles.suggestionBanner}>
					<Ionicons name='trending-up' size={16} color='#AFFF2B' />
					<Text style={styles.suggestionText}>
						{weightSuggestion.reason} — try{' '}
						<Text style={styles.suggestionWeight}>
							{weightSuggestion.suggestedWeight} lbs
						</Text>{' '}
						today
					</Text>
					<TouchableOpacity
						onPress={() => onAcknowledgeSuggestion(exercise.name)}
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<Ionicons name='close' size={16} color='#666666' />
					</TouchableOpacity>
				</View>
			)}

			{exercise.expanded && (
				<SetTable
					exercise={exercise}
					exerciseIndex={exerciseIndex}
					sets={exercise.sets}
					updateSetField={updateSetField}
					saveSet={saveSet}
					removeSet={removeSet}
					editSet={editSet}
					addSet={addSet}
					normalizeNumberText={normalizeNumberText}
					getPreviousSet={getPreviousSet}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	exerciseCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	suggestionBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.08)',
		borderWidth: 1,
		borderColor: 'rgba(175, 255, 43, 0.25)',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginTop: 10,
		marginBottom: 2
	},
	suggestionText: {
		flex: 1,
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#CCCCCC'
	},
	suggestionWeight: {
		color: '#AFFF2B'
	}
})
