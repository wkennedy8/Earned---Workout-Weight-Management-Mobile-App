import { IconSymbol } from '@/components/ui/icon-symbol';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomTabBar({ state, descriptors, navigation }) {
	return (
		<View style={styles.container}>
			<BlurView intensity={80} tint='dark' style={styles.blurContainer}>
				<View style={styles.tabBar}>
					{state.routes.map((route, index) => {
						const { options } = descriptors[route.key];
						const label =
							options.tabBarLabel !== undefined
								? options.tabBarLabel
								: options.title !== undefined
									? options.title
									: route.name;

						const isFocused = state.index === index;

						const onPress = () => {
							const event = navigation.emit({
								type: 'tabPress',
								target: route.key,
								canPreventDefault: true
							});

							if (!isFocused && !event.defaultPrevented) {
								navigation.navigate(route.name);
							}
						};

						// Render icon based on route name
						const renderIcon = () => {
							const iconColor = isFocused ? '#AFFF2B' : '#FFFFFF';
							const iconOpacity = isFocused ? 1 : 0.5;

							switch (route.name) {
								case 'index':
									return (
										<IconSymbol
											size={24}
											name='house.fill'
											color={iconColor}
											style={{ opacity: iconOpacity }}
										/>
									);
								case 'workout':
									return (
										<FontAwesome6
											size={22}
											name='dumbbell'
											color={iconColor}
											style={{ opacity: iconOpacity }}
										/>
									);
								case 'profile':
									return (
										<IconSymbol
											size={24}
											name='person.fill'
											color={iconColor}
											style={{ opacity: iconOpacity }}
										/>
									);
								default:
									return null;
							}
						};

						return (
							<TouchableOpacity
								key={route.key}
								accessibilityRole='button'
								accessibilityState={isFocused ? { selected: true } : {}}
								accessibilityLabel={options.tabBarAccessibilityLabel}
								testID={options.tabBarTestID}
								onPress={onPress}
								style={styles.tab}
								activeOpacity={0.7}
							>
								<View style={styles.iconContainer}>{renderIcon()}</View>
								<Text style={[styles.label, isFocused && styles.labelActive]}>
									{label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</BlurView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
		height: 70,
		borderRadius: 35,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10
	},
	blurContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
	},
	tabBar: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingHorizontal: 20
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8
	},
	iconContainer: {
		marginBottom: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	label: {
		fontSize: 11,
		fontWeight: '600',
		color: '#FFFFFF',
		opacity: 0.5
	},
	labelActive: {
		opacity: 1,
		fontWeight: '700',
		color: '#AFFF2B'
	}
});
