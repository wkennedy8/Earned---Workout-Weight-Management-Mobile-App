import { useOnboarding } from '@/context/OnboardingContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function NameScreen() {
	const router = useRouter();
	const { data, updateData } = useOnboarding();
	const [name, setName] = useState(data.name);

	function handleContinue() {
		if (!name.trim()) {
			alert('Please enter your name');
			return;
		}

		updateData('name', name.trim());
		router.push('/onboarding/email');
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				<View style={styles.content}>
					{/* Progress */}
					<View style={styles.progressBar}>
						<View style={[styles.progressSegment, styles.progressActive]} />
						<View style={styles.progressSegment} />
						<View style={styles.progressSegment} />
						<View style={styles.progressSegment} />
						<View style={styles.progressSegment} />
					</View>

					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>What's your name?</Text>
						<Text style={styles.subtitle}>Let's get to know you better</Text>
					</View>

					{/* Input */}
					<TextInput
						style={styles.input}
						placeholder='Enter your name'
						placeholderTextColor='#666666'
						value={name}
						onChangeText={setName}
						autoFocus
						autoCapitalize='words'
						returnKeyType='next'
						onSubmitEditing={handleContinue}
					/>
				</View>

				{/* Bottom Button */}
				<TouchableOpacity
					style={[styles.button, !name.trim() && styles.buttonDisabled]}
					onPress={handleContinue}
					disabled={!name.trim()}
					activeOpacity={0.9}
				>
					<Text style={styles.buttonText}>Continue</Text>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1, paddingHorizontal: 24 },
	content: { flex: 1, paddingTop: 20 },

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
	},

	header: {
		marginBottom: 32
	},
	title: {
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#999999'
	},

	input: {
		height: 56,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		paddingHorizontal: 16,
		fontSize: 18,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A'
	},

	button: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24
	},
	buttonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
