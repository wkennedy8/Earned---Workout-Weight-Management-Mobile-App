import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function WorkoutLayout() {
	const router = useRouter();

	return (
		<Stack>
			<Stack.Screen
				name='details'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerTitle: 'Workout Details',
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: 'transparent'
					},
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							style={{
								marginLeft: 2
							}}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
						</TouchableOpacity>
					)
				}}
			/>
			<Stack.Screen
				name='session'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerTitle: '',
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: 'transparent'
					},
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							style={{
								marginLeft: 2
							}}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
						</TouchableOpacity>
					)
				}}
			/>
		</Stack>
	);
}
