import { FontFamily } from '@/constants/fonts';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FinishWorkoutButton({ onFinish }) {
	return (
		<View style={styles.bottomCta}>
			<TouchableOpacity
				style={styles.finishButton}
				onPress={onFinish}
				activeOpacity={0.9}
			>
				<Text style={styles.finishButtonText}>Finish Workout</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	bottomCta: { position: 'absolute', left: 18, right: 18, bottom: 12 },
	finishButton: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 2
	},
	finishButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.black
	}
});
