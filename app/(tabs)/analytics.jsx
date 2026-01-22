import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function AnalyticsScreen() {
	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Analytics</Text>
				</View>

				{/* Placeholder Content */}
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Coming Soon</Text>
					<Text style={styles.subtle}>
						Analytics and insights will be available here.
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
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 40
	},
	header: {
		marginBottom: 16
	},
	title: {
		fontSize: 26,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	subtle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 6,
		lineHeight: 18
	}
});
