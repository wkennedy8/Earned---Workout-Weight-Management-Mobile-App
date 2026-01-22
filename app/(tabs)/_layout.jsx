import CustomTabBar from '@/components/CustomTabBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false
			}}
			tabBar={(props) => <CustomTabBar {...props} />}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarLabel: 'Home'
				}}
			/>
			<Tabs.Screen
				name='workout'
				options={{
					title: 'Workout',
					tabBarLabel: 'Workout'
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					title: 'Profile',
					tabBarLabel: 'Profile'
				}}
			/>
		</Tabs>
	);
}
