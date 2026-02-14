import { FontFamily } from '@/constants/fonts';
import { formatLongDate } from '@/utils/dateUtils';
import { tagColor } from '@/utils/workoutUtils';
import { StyleSheet, Text, View } from 'react-native';

export default function SessionHeader({ session, currentWeek, today }) {
	return (
		<View style={styles.header}>
			<View style={styles.headerRow}>
				<View
					style={[styles.tagPill, { backgroundColor: tagColor(session.tag) }]}
				>
					<Text style={styles.tagText}>{session.tag}</Text>
				</View>
				<Text style={styles.headerTitle}>{session.title}</Text>
			</View>
			<View style={styles.weekBadgeRow}>
				<Text style={styles.dateText}>{formatLongDate(today)}</Text>
				<View style={styles.weekBadge}>
					<Text style={styles.weekBadgeText}>Week {currentWeek}</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: { marginBottom: 12 },
	headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
	headerTitle: { fontSize: 22, fontFamily: FontFamily.black, color: '#FFFFFF' },
	weekBadgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 6
	},
	dateText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#999999'
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
	}
});
