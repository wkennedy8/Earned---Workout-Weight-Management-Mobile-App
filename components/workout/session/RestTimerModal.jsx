import { FontFamily } from '@/constants/fonts';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function formatTimer(seconds) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RestTimerModal({
	visible,
	restSeconds,
	restContext,
	restPaused,
	progress,
	onSkip,
	onTogglePause,
	onAddTime,
	onSubtractTime
}) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			onRequestClose={onSkip}
		>
			<View style={styles.modalBackdrop}>
				<View style={styles.modalCard}>
					{/* Circular Progress */}
					<View style={styles.circleContainer}>
						<Svg width={200} height={200} viewBox='0 0 200 200'>
							{/* Background circle */}
							<Circle
								cx='100'
								cy='100'
								r='90'
								stroke='#2A2A2A'
								strokeWidth='12'
								fill='none'
							/>
							{/* Progress circle */}
							<AnimatedCircle
								cx='100'
								cy='100'
								r='90'
								stroke='#AFFF2B'
								strokeWidth='12'
								fill='none'
								strokeLinecap='round'
								strokeDasharray={`${2 * Math.PI * 90}`}
								strokeDashoffset={2 * Math.PI * 90 * (1 - progress.value)}
								transform='rotate(-90 100 100)'
							/>
						</Svg>
						<View style={styles.timerOverlay}>
							<Text style={styles.modalTimer}>{formatTimer(restSeconds)}</Text>
						</View>
					</View>

					<Text style={styles.modalContext}>
						{restContext?.type === 'exercise'
							? `Exercise completed: ${restContext.exerciseName}`
							: restContext?.type === 'set'
								? `Set saved: ${restContext.exerciseName} (Set ${restContext.setIndex})`
								: ''}
					</Text>

					{/* Time adjustment buttons */}
					<View style={styles.modalActionsRow}>
						<TouchableOpacity
							style={styles.modalSecondaryBtn}
							onPress={() => onSubtractTime(30)}
							activeOpacity={0.9}
							disabled={restSeconds <= 30}
						>
							<Text
								style={[
									styles.modalSecondaryText,
									restSeconds <= 30 && styles.modalSecondaryTextDisabled
								]}
							>
								-30s
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.modalPauseBtn,
								restPaused && styles.modalPauseBtnActive
							]}
							onPress={onTogglePause}
							activeOpacity={0.9}
						>
							<Text
								style={[
									styles.modalPauseText,
									restPaused && styles.modalPauseTextActive
								]}
							>
								{restPaused ? 'Resume' : 'Pause'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.modalSecondaryBtn}
							onPress={() => onAddTime(30)}
							activeOpacity={0.9}
						>
							<Text style={styles.modalSecondaryText}>+30s</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={styles.modalPrimaryBtn}
						onPress={onSkip}
						activeOpacity={0.9}
					>
						<Text style={styles.modalPrimaryText}>Skip Rest</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.85)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 18
	},
	modalCard: {
		width: '100%',
		borderRadius: 18,
		backgroundColor: '#1A1A1A',
		padding: 18,
		borderWidth: 1,
		borderColor: '#333333'
	},
	circleContainer: {
		marginTop: 20,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative'
	},
	timerOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalTimer: {
		fontSize: 48,
		fontWeight: '900',
		color: '#fff',
		textAlign: 'center'
	},
	modalContext: {
		marginTop: 20,
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center'
	},
	modalActionsRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 20
	},
	modalSecondaryBtn: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalSecondaryText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	modalSecondaryTextDisabled: {
		color: '#666666'
	},
	modalPauseBtn: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		borderWidth: 2,
		borderColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalPauseBtnActive: {
		backgroundColor: '#AFFF2B'
	},
	modalPauseText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	modalPauseTextActive: {
		color: '#000000'
	},
	modalPrimaryBtn: {
		marginTop: 10,
		height: 50,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalPrimaryText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
