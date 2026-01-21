import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'progress_photo_reminder_id_v1';
const PROGRESS_PHOTOS_KEY = 'progress_photos_v1';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false
	})
});

function formatLocalDateKey(date = new Date()) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function hasProgressPhotoToday(photos) {
	const todayKey = formatLocalDateKey(new Date());
	return (photos || []).some((p) => {
		const dt = new Date(p.createdAt);
		if (Number.isNaN(dt.getTime())) return false;
		return formatLocalDateKey(dt) === todayKey;
	});
}

function next8pmTriggerDate() {
	const now = new Date();
	const trigger = new Date(now);
	trigger.setHours(20, 0, 0, 0); // 8:00 PM local time

	// If it's already past 8pm, schedule for tomorrow 8pm
	if (now.getTime() >= trigger.getTime()) {
		trigger.setDate(trigger.getDate() + 1);
	}
	return trigger;
}

export async function registerForNotificationsAsync() {
	const settings = await Notifications.getPermissionsAsync();
	let status = settings.status;

	if (status !== 'granted') {
		const req = await Notifications.requestPermissionsAsync();
		status = req.status;
	}

	return status === 'granted';
}

export async function cancelProgressPhotoReminder() {
	try {
		const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
		if (id) {
			await Notifications.cancelScheduledNotificationAsync(id);
			await AsyncStorage.removeItem(REMINDER_ID_KEY);
		}
	} catch (e) {
		console.warn('Failed to cancel reminder:', e);
	}
}

export async function scheduleProgressPhotoReminderIfNeeded() {
	try {
		// If user already logged a photo today, do not schedule
		const raw = await AsyncStorage.getItem(PROGRESS_PHOTOS_KEY);
		const photos = raw ? JSON.parse(raw) : [];
		const safe = Array.isArray(photos) ? photos : [];

		if (hasProgressPhotoToday(safe)) {
			await cancelProgressPhotoReminder();
			return;
		}

		// Cancel any previous scheduled reminder before scheduling a fresh one
		await cancelProgressPhotoReminder();

		const triggerDate = next8pmTriggerDate();

		const id = await Notifications.scheduleNotificationAsync({
			content: {
				title: 'Progress Photo Reminder',
				body: 'You haven’t uploaded a progress photo today. Take one now to stay consistent.'
			},
			trigger: triggerDate // exact local date/time
		});

		await AsyncStorage.setItem(REMINDER_ID_KEY, id);
	} catch (e) {
		console.warn('Failed to schedule reminder:', e);
	}
}
