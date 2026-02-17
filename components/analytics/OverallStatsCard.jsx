import { FontFamily } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function OverallStatsCard({
	completedSessions,
	streak,
	totalVolume,
	totalSets,
	totalReps,
	currentWeek
}) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.sectionTitle}>Overall Stats</Text>
				<View style={styles.weekBadge}>
					<Text style={styles.weekBadgeText}>Week {currentWeek}/8</Text>
				</View>
			</View>

			<View style={styles.statsGrid}>
				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='barbell-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{completedSessions.length}</Text>
					<Text style={styles.statLabel}>Workouts</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='flame-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{streak}</Text>
					<Text style={styles.statLabel}>Day Streak</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='trending-up-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>
						{Math.round(totalVolume).toLocaleString()}
					</Text>
					<Text style={styles.statLabel}>Total Volume</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='list-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{totalSets}</Text>
					<Text style={styles.statLabel}>Total Sets</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='repeat-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{totalReps}</Text>
					<Text style={styles.statLabel}>Total Reps</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='calendar-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>
						{completedSessions.length > 0
							? (totalVolume / completedSessions.length).toFixed(0)
							: 0}
					</Text>
					<Text style={styles.statLabel}>Avg Volume</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	weekBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		borderWidth: 1,
		borderColor: '#AFFF2B'
	},
	weekBadgeText: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		marginTop: 12
	},
	statBox: {
		width: '31%',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 12,
		alignItems: 'center'
	},
	statIconBadge: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8
	},
	statValue: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 4
	},
	statLabel: {
		fontSize: 10,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center'
	}
});
