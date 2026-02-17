import { FontFamily } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function CardioStatsCard({
	cardioSessions,
	totalCardioTime,
	totalCardioDistance,
	cardioStreak,
	CARDIO_TYPES
}) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.sectionTitle}>Cardio Stats</Text>
				<Ionicons name='bicycle' size={20} color='#AFFF2B' />
			</View>

			<View style={styles.statsGrid}>
				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='bicycle-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{cardioSessions.length}</Text>
					<Text style={styles.statLabel}>Sessions</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='time-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{Math.round(totalCardioTime)}</Text>
					<Text style={styles.statLabel}>Minutes</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='location-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>
						{totalCardioDistance > 0 ? totalCardioDistance.toFixed(1) : 0}
					</Text>
					<Text style={styles.statLabel}>Miles</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='flame-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>{cardioStreak}</Text>
					<Text style={styles.statLabel}>Week Streak</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='speedometer-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>
						{cardioSessions.length > 0
							? Math.round(totalCardioTime / cardioSessions.length)
							: 0}
					</Text>
					<Text style={styles.statLabel}>Avg Duration</Text>
				</View>

				<View style={styles.statBox}>
					<View style={styles.statIconBadge}>
						<Ionicons name='calendar-outline' size={20} color='#AFFF2B' />
					</View>
					<Text style={styles.statValue}>
						{cardioSessions.length > 0 && totalCardioDistance > 0
							? (
									totalCardioDistance /
									cardioSessions.filter((s) => s.distance).length
								).toFixed(1)
							: 0}
					</Text>
					<Text style={styles.statLabel}>Avg Distance</Text>
				</View>
			</View>

			{/* Recent Cardio Activity */}
			{cardioSessions.length > 0 && (
				<View style={styles.recentCardio}>
					<Text style={styles.recentCardioTitle}>Recent Activity</Text>
					<View style={styles.recentCardioList}>
						{cardioSessions.slice(0, 5).map((session) => {
							const cardioType = CARDIO_TYPES.find(
								(t) => t.id === session.type
							);
							return (
								<View key={session.id} style={styles.recentCardioItem}>
									<View style={styles.recentCardioLeft}>
										<View style={styles.recentCardioIcon}>
											<Ionicons
												name={cardioType?.icon || 'bicycle'}
												size={16}
												color='#AFFF2B'
											/>
										</View>
										<View>
											<Text style={styles.recentCardioType}>
												{cardioType?.label || session.type}
											</Text>
											<Text style={styles.recentCardioDate}>
												{new Date(session.date).toLocaleDateString()}
											</Text>
										</View>
									</View>
									<View style={styles.recentCardioStats}>
										<Text style={styles.recentCardioStat}>
											{session.duration} min
										</Text>
										{session.distance && (
											<Text style={styles.recentCardioStat}>
												{session.distance} mi
											</Text>
										)}
									</View>
								</View>
							);
						})}
					</View>
				</View>
			)}

			{cardioSessions.length === 0 && (
				<View style={styles.emptyRecords}>
					<Ionicons name='bicycle-outline' size={48} color='#333333' />
					<Text style={styles.emptyRecordsText}>No cardio sessions yet</Text>
					<Text style={styles.emptyRecordsSubtext}>
						Start logging cardio from the Workout tab
					</Text>
				</View>
			)}
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
	},
	recentCardio: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A'
	},
	recentCardioTitle: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	recentCardioList: {
		gap: 10
	},
	recentCardioItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#2A2A2A',
		borderRadius: 10,
		padding: 10
	},
	recentCardioLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1
	},
	recentCardioIcon: {
		width: 32,
		height: 32,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	recentCardioType: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	recentCardioDate: {
		fontSize: 10,
		fontWeight: '700',
		color: '#666666',
		marginTop: 2
	},
	recentCardioStats: {
		alignItems: 'flex-end'
	},
	recentCardioStat: {
		fontSize: 11,
		fontWeight: '700',
		color: '#999999'
	},
	emptyRecords: {
		alignItems: 'center',
		paddingVertical: 32
	},
	emptyRecordsText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginTop: 12
	},
	emptyRecordsSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center',
		paddingHorizontal: 20
	}
});
