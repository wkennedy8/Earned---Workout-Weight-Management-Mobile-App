import { Audio } from 'expo-av';

/**
 * Play notification chime when rest timer completes
 */
export async function playChime() {
	try {
		const { sound } = await Audio.Sound.createAsync(
			{
				uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
			},
			{ shouldPlay: true }
		);

		setTimeout(() => {
			sound.unloadAsync();
		}, 1000);
	} catch (error) {
		console.log('Sound playback failed, using haptics only');
	}
}

/**
 * Format seconds as M:SS timer display
 */
export function formatTimer(seconds) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}
