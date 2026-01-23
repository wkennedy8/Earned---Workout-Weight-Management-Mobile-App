import { CARDIO_TYPES } from '@/controllers/cardioController';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../constants/fonts';

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width - 48;
const CARD_WIDTH = (MODAL_WIDTH - 72) / 3; // 3 columns with gaps and padding

export default function CardioModal({
	visible,
	onClose,
	onSave,
	initialData = null
}) {
	const [type, setType] = useState(initialData?.type || null);
	const [duration, setDuration] = useState(
		initialData?.duration?.toString() || ''
	);
	const [distance, setDistance] = useState(
		initialData?.distance?.toString() || ''
	);
	const [notes, setNotes] = useState(initialData?.notes || '');
	const [saving, setSaving] = useState(false);

	function handleSave() {
		if (!type || !duration) {
			alert('Please select a type and enter duration');
			return;
		}

		setSaving(true);
		onSave({
			type,
			duration: parseInt(duration),
			distance: distance ? parseFloat(distance) : null,
			notes: notes.trim()
		});
	}

	function handleClose() {
		// Reset form
		setType(null);
		setDuration('');
		setDistance('');
		setNotes('');
		setSaving(false);
		onClose();
	}

	return (
		<Modal
			visible={visible}
			animationType='fade'
			transparent={true}
			onRequestClose={handleClose}
		>
			<View style={styles.modalOverlay}>
				<TouchableOpacity
					style={styles.backdrop}
					activeOpacity={1}
					onPress={handleClose}
				/>

				<View style={styles.modalContainer}>
					{/* Header */}
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Log Cardio</Text>
						<TouchableOpacity
							onPress={handleClose}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							style={styles.closeButton}
						>
							<Ionicons name='close-circle' size={28} color='#666666' />
						</TouchableOpacity>
					</View>

					<View style={styles.modalContent}>
						{/* Type Selection */}
						<View style={styles.section}>
							<Text style={styles.label}>Activity Type *</Text>
							<View style={styles.typeGrid}>
								{CARDIO_TYPES.map((cardioType) => (
									<TouchableOpacity
										key={cardioType.id}
										style={[
											styles.typeCard,
											type === cardioType.id && styles.typeCardActive
										]}
										onPress={() => setType(cardioType.id)}
										activeOpacity={0.7}
									>
										<View
											style={[
												styles.typeIconContainer,
												type === cardioType.id && styles.typeIconContainerActive
											]}
										>
											<Ionicons
												name={cardioType.icon}
												size={20}
												color={type === cardioType.id ? '#000000' : '#AFFF2B'}
											/>
										</View>
										<Text
											style={[
												styles.typeLabel,
												type === cardioType.id && styles.typeLabelActive
											]}
										>
											{cardioType.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{/* Duration & Distance Row */}
						<View style={styles.row}>
							<View style={styles.halfSection}>
								<Text style={styles.label}>Duration *</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={duration}
										onChangeText={setDuration}
										placeholder='30'
										placeholderTextColor='#666666'
										keyboardType='numeric'
									/>
									<Text style={styles.inputSuffix}>min</Text>
								</View>
							</View>

							<View style={styles.halfSection}>
								<Text style={styles.label}>Distance</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={distance}
										onChangeText={setDistance}
										placeholder='3.5'
										placeholderTextColor='#666666'
										keyboardType='decimal-pad'
									/>
									<Text style={styles.inputSuffix}>mi</Text>
								</View>
							</View>
						</View>

						{/* Notes */}
						<View style={styles.section}>
							<Text style={styles.label}>Notes (optional)</Text>
							<TextInput
								style={styles.textArea}
								value={notes}
								onChangeText={setNotes}
								placeholder='How did it feel?'
								placeholderTextColor='#666666'
								multiline
								numberOfLines={2}
								textAlignVertical='top'
								maxLength={100}
							/>
						</View>
					</View>

					{/* Save Button */}
					<View style={styles.modalFooter}>
						<TouchableOpacity
							style={[
								styles.saveButton,
								(!type || !duration) && styles.saveButtonDisabled
							]}
							onPress={handleSave}
							disabled={!type || !duration || saving}
							activeOpacity={0.9}
						>
							{saving ? (
								<ActivityIndicator color='#000000' />
							) : (
								<>
									<Ionicons name='checkmark-circle' size={20} color='#000000' />
									<Text style={styles.saveButtonText}>Save Session</Text>
								</>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.85)'
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	},
	modalContainer: {
		width: MODAL_WIDTH,
		backgroundColor: '#0D0D0D',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#333333'
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	modalTitle: {
		fontSize: 20,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	closeButton: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalContent: {
		paddingHorizontal: 20,
		paddingVertical: 16
	},
	section: {
		marginBottom: 16
	},
	row: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 16
	},
	halfSection: {
		flex: 1
	},
	label: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	typeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10
	},
	typeCard: {
		width: CARD_WIDTH,
		height: 80,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#2A2A2A',
		backgroundColor: '#1A1A1A',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		padding: 8
	},
	typeCardActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	typeIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	typeIconContainerActive: {
		backgroundColor: 'rgba(0, 0, 0, 0.15)'
	},
	typeLabel: {
		fontSize: 10,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		textAlign: 'center'
	},
	typeLabelActive: {
		color: '#000000'
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		borderWidth: 2,
		borderColor: '#2A2A2A',
		borderRadius: 12,
		paddingHorizontal: 12,
		backgroundColor: '#1A1A1A'
	},
	input: {
		flex: 1,
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		padding: 0
	},
	inputSuffix: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666666',
		marginLeft: 8
	},
	textArea: {
		height: 60,
		borderWidth: 2,
		borderColor: '#2A2A2A',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 14,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A'
	},
	modalFooter: {
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 20,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A'
	},
	saveButton: {
		height: 52,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		shadowColor: '#AFFF2B',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8
	},
	saveButtonDisabled: {
		backgroundColor: '#2A2A2A',
		opacity: 0.5,
		shadowOpacity: 0
	},
	saveButtonText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
