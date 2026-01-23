import { StyleSheet, View } from 'react-native';

export default function ProgressBar({ currentStep, totalSteps }) {
	return (
		<View style={styles.progressBar}>
			{Array.from({ length: totalSteps }).map((_, index) => (
				<View
					key={index}
					style={[
						styles.progressSegment,
						index <= currentStep && styles.progressActive
					]}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
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
	}
});
