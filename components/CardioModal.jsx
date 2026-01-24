import { CARDIO_TYPES } from '@/controllers/cardioController';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Keyboard,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View
} from 'react-native';
import { FontFamily } from '../constants/fonts';

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width - 48;
const CARD_WIDTH = (MODAL_WIDTH - 72) / 3;

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
	const [speed, setSpeed] = useState(initialData?.speed?.toString() || '');
	const [incline, setIncline] = useState(
		initialData?.incline?.toString() || ''
	);
	const [level, setLevel] = useState(initialData?.level?.toString() || '');
	const [pace, setPace] = useState(initialData?.pace?.toString() || '');
	const [notes, setNotes] = useState(initialData?.notes || '');
	const [saving, setSaving] = useState(false);

	// Auto-calculate pace for running if duration and distance are provided
	useEffect(() => {
		if (type === 'running' && duration && distance) {
			const durationMin = parseFloat(duration);
			const distanceMi = parseFloat(distance);
			if (durationMin > 0 && distanceMi > 0) {
				const paceValue = durationMin / distanceMi;
				setPace(paceValue.toFixed(2));
			}
		}
	}, [type, duration, distance]);

	function handleSave() {
		if (!type || !duration) {
			alert('Please select a type and enter duration');
			return;
		}

		Keyboard.dismiss();
		setSaving(true);
		const data = {
			type,
			duration: parseInt(duration),
			notes: notes.trim()
		};

		// Add optional fields based on type
		if (distance) data.distance = parseFloat(distance);
		if (speed) data.speed = parseFloat(speed);
		if (incline) data.incline = parseFloat(incline);
		if (level) data.level = parseInt(level);
		if (pace) data.pace = parseFloat(pace);

		onSave(data);
	}

	function handleClose() {
		Keyboard.dismiss();
		// Reset form
		setType(null);
		setDuration('');
		setDistance('');
		setSpeed('');
		setIncline('');
		setLevel('');
		setPace('');
		setNotes('');
		setSaving(false);
		onClose();
	}

	// Render input fields based on selected cardio type
	function renderTypeInputs() {
		switch (type) {
			case 'treadmill':
				return (
					<>
						<View style={styles.row}>
							<View style={styles.thirdSection}>
								<Text style={styles.label}>Duration *</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={duration}
										onChangeText={setDuration}
										placeholder='30'
										placeholderTextColor='#666666'
										keyboardType='numeric'
										returnKeyType='done'
									/>
									<Text style={styles.inputSuffix}>min</Text>
								</View>
							</View>

							<View style={styles.thirdSection}>
								<Text style={styles.label}>Incline</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={incline}
										onChangeText={setIncline}
										placeholder='5.0'
										placeholderTextColor='#666666'
										keyboardType='decimal-pad'
										returnKeyType='done'
									/>
									<Text style={styles.inputSuffix}>%</Text>
								</View>
							</View>

							<View style={styles.thirdSection}>
								<Text style={styles.label}>Speed</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={speed}
										onChangeText={setSpeed}
										placeholder='6.0'
										placeholderTextColor='#666666'
										keyboardType='decimal-pad'
										returnKeyType='done'
									/>
									<Text style={styles.inputSuffix}>mph</Text>
								</View>
							</View>
						</View>
					</>
				);

			case 'running':
				return (
					<>
						<View style={styles.row}>
							<View style={styles.thirdSection}>
								<Text style={styles.label}>Duration *</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={duration}
										onChangeText={setDuration}
										placeholder='30'
										placeholderTextColor='#666666'
										keyboardType='numeric'
										returnKeyType='done'
									/>
									<Text style={styles.inputSuffix}>min</Text>
								</View>
							</View>

							<View style={styles.thirdSection}>
								<Text style={styles.label}>Distance</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={distance}
										onChangeText={setDistance}
										placeholder='3.5'
										placeholderTextColor='#666666'
										keyboardType='decimal-pad'
										returnKeyType='done'
									/>
									<Text style={styles.inputSuffix}>mi</Text>
								</View>
							</View>

							<View style={styles.thirdSection}>
								<Text style={styles.label}>Pace</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={pace}
										onChangeText={setPace}
										placeholder='8.5'
										placeholderTextColor='#666666'
										keyboardType='decimal-pad'
										returnKeyType='done'
										editable={!(duration && distance)} // Auto-calc if both present
									/>
									<Text style={styles.inputSuffix}>min/mi</Text>
								</View>
							</View>
						</View>
						{duration && distance && (
							<Text style={styles.autoCalcNote}>
								Pace auto-calculated from duration and distance
							</Text>
						)}
					</>
				);

			case 'walking':
				return (
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
									returnKeyType='done'
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
									placeholder='2.0'
									placeholderTextColor='#666666'
									keyboardType='decimal-pad'
									returnKeyType='done'
								/>
								<Text style={styles.inputSuffix}>mi</Text>
							</View>
						</View>
					</View>
				);

			case 'stairmaster':
				return (
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
									returnKeyType='done'
								/>
								<Text style={styles.inputSuffix}>min</Text>
							</View>
						</View>

						<View style={styles.halfSection}>
							<Text style={styles.label}>Level</Text>
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.input}
									value={level}
									onChangeText={setLevel}
									placeholder='8'
									placeholderTextColor='#666666'
									keyboardType='numeric'
									returnKeyType='done'
								/>
							</View>
						</View>
					</View>
				);

			case 'cycling':
			case 'swimming':
			case 'other':
			default:
				return (
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
									returnKeyType='done'
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
									placeholder='5.0'
									placeholderTextColor='#666666'
									keyboardType='decimal-pad'
									returnKeyType='done'
								/>
								<Text style={styles.inputSuffix}>mi</Text>
							</View>
						</View>
					</View>
				);
		}
	}

	return (
		<Modal
			visible={visible}
			animationType='fade'
			transparent={true}
			onRequestClose={handleClose}
		>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.modalOverlay}>
					<TouchableOpacity
						style={styles.backdrop}
						activeOpacity={1}
						onPress={handleClose}
					/>

					<TouchableWithoutFeedback onPress={() => {}}>
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

							<ScrollView
								style={styles.scrollView}
								contentContainerStyle={styles.modalContent}
								keyboardShouldPersistTaps='handled'
								showsVerticalScrollIndicator={false}
								bounces={false}
							>
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
												onPress={() => {
													setType(cardioType.id);
													Keyboard.dismiss();
												}}
												activeOpacity={0.7}
											>
												<View
													style={[
														styles.typeIconContainer,
														type === cardioType.id &&
															styles.typeIconContainerActive
													]}
												>
													<Ionicons
														name={cardioType.icon}
														size={20}
														color={
															type === cardioType.id ? '#000000' : '#AFFF2B'
														}
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

								{/* Dynamic inputs based on type */}
								{type && renderTypeInputs()}

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
										returnKeyType='done'
										blurOnSubmit={true}
									/>
								</View>
							</ScrollView>

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
											<Ionicons
												name='checkmark-circle'
												size={20}
												color='#000000'
											/>
											<Text style={styles.saveButtonText}>Save Session</Text>
										</>
									)}
								</TouchableOpacity>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
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
		borderColor: '#333333',
		maxHeight: '85%'
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
	scrollView: {
		flexGrow: 0
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
	thirdSection: {
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
	autoCalcNote: {
		fontSize: 10,
		fontWeight: '700',
		color: '#AFFF2B',
		marginTop: -8,
		marginBottom: 8,
		fontStyle: 'italic'
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
