import { useAuth } from '@/context/AuthContext';
import { getProfile, upsertProfile } from '@/controllers/profileController';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function UnitsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [weightUnit, setWeightUnit] = useState('lbs'); // 'lbs' or 'kg'
	const [distanceUnit, setDistanceUnit] = useState('miles'); // 'miles' or 'km'

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const profile = await getProfile(user.uid);
				setWeightUnit(profile?.weightUnit || 'lbs');
				setDistanceUnit(profile?.distanceUnit || 'miles');
			} catch (error) {
				console.error('Failed to load units:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSave() {
		if (!user?.uid) return;

		setSaving(true);
		try {
			await upsertProfile(user.uid, {
				weightUnit,
				distanceUnit
			});

			Alert.alert('Success', 'Units updated');
			router.back();
		} catch (error) {
			console.error('Failed to save units:', error);
			Alert.alert('Error', 'Failed to update units');
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Units of Measure</Text>
						<Text style={styles.subtitle}>
							Choose your preferred measurement system
						</Text>
					</View>

					{/* Weight Units */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Weight</Text>
						<View style={styles.optionGroup}>
							<TouchableOpacity
								style={[
									styles.option,
									weightUnit === 'lbs' && styles.optionActive
								]}
								onPress={() => setWeightUnit('lbs')}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.optionText,
										weightUnit === 'lbs' && styles.optionTextActive
									]}
								>
									Pounds (lbs)
								</Text>
								{weightUnit === 'lbs' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.option,
									weightUnit === 'kg' && styles.optionActive
								]}
								onPress={() => setWeightUnit('kg')}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.optionText,
										weightUnit === 'kg' && styles.optionTextActive
									]}
								>
									Kilograms (kg)
								</Text>
								{weightUnit === 'kg' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>
						</View>
					</View>

					{/* Distance Units */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Distance</Text>
						<View style={styles.optionGroup}>
							<TouchableOpacity
								style={[
									styles.option,
									distanceUnit === 'miles' && styles.optionActive
								]}
								onPress={() => setDistanceUnit('miles')}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.optionText,
										distanceUnit === 'miles' && styles.optionTextActive
									]}
								>
									Miles
								</Text>
								{distanceUnit === 'miles' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.option,
									distanceUnit === 'km' && styles.optionActive
								]}
								onPress={() => setDistanceUnit('km')}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.optionText,
										distanceUnit === 'km' && styles.optionTextActive
									]}
								>
									Kilometers
								</Text>
								{distanceUnit === 'km' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={styles.bottomButton}>
					<TouchableOpacity
						style={styles.saveButton}
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.9}
					>
						{saving ? (
							<ActivityIndicator color='#000000' />
						) : (
							<Text style={styles.saveButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 100
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
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
		marginBottom: 24
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 12
	},
	optionGroup: {
		gap: 12
	},
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	optionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	optionText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF'
	},
	optionTextActive: {
		color: '#000000'
	},

	bottomButton: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 12
	},
	saveButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
