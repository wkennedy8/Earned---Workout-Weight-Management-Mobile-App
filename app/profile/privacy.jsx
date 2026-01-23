import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function PrivacyScreen() {
	const router = useRouter();

	function handleOpenLink(url) {
		Linking.openURL(url);
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
					<Text style={styles.title}>Privacy</Text>
					<Text style={styles.subtitle}>
						Manage your data and privacy settings
					</Text>
				</View>

				{/* Privacy Options */}
				<View style={styles.section}>
					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => handleOpenLink('https://example.com/privacy')}
						activeOpacity={0.7}
					>
						<View style={styles.menuLeft}>
							<Ionicons
								name='document-text-outline'
								size={22}
								color='#AFFF2B'
							/>
							<Text style={styles.menuLabel}>Privacy Policy</Text>
						</View>
						<Ionicons name='open-outline' size={20} color='#666666' />
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => handleOpenLink('https://example.com/terms')}
						activeOpacity={0.7}
					>
						<View style={styles.menuLeft}>
							<Ionicons name='reader-outline' size={22} color='#AFFF2B' />
							<Text style={styles.menuLabel}>Terms of Service</Text>
						</View>
						<Ionicons name='open-outline' size={20} color='#666666' />
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => router.push('/profile/data-export')}
						activeOpacity={0.7}
					>
						<View style={styles.menuLeft}>
							<Ionicons name='download-outline' size={22} color='#AFFF2B' />
							<Text style={styles.menuLabel}>Export My Data</Text>
						</View>
						<Ionicons name='chevron-forward' size={20} color='#666666' />
					</TouchableOpacity>
				</View>

				{/* Info Card */}
				<View style={styles.infoCard}>
					<Ionicons
						name='information-circle-outline'
						size={32}
						color='#AFFF2B'
					/>
					<Text style={styles.infoTitle}>Your Data is Secure</Text>
					<Text style={styles.infoText}>
						We use industry-standard encryption to protect your personal
						information. Your workout data is private and never shared without
						your consent.
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

	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#333333',
		marginBottom: 24
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	menuLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	menuLabel: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF'
	},

	infoCard: {
		padding: 20,
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center'
	},
	infoTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 12,
		marginBottom: 8
	},
	infoText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center',
		lineHeight: 20
	}
});
