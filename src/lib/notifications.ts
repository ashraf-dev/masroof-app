import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { translate } from '@/i18n';
import { addMonths, daysInMonth, parseISODate, toISODate, today } from './dates';
import type { Profile } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL = 'reminders';

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Re-creates all local reminders from the profile. Local notifications keep
 * working offline, which matches the app's offline-first design.
 */
export async function scheduleReminders(profile: Profile) {
  if (Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const lang = profile.language;
  const hour = profile.notification_hour;

  // Weekly summary. expo-notifications weekdays are 1 = Sunday … 7 = Saturday.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(lang, 'summary.notificationTitle'),
      body: translate(lang, 'summary.notificationBody'),
      data: { url: '/weekly-summary' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: profile.weekly_summary_day + 1,
      hour,
      minute: 0,
      channelId: CHANNEL,
    },
  });

  // Salary prompt on payday. Scheduled as individual dates for the next months
  // so a payday of 31 lands on the last day of shorter months.
  if (profile.salary_day) {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const first = addMonths(today().slice(0, 8) + '01', i);
      const d = parseISODate(first);
      d.setDate(Math.min(profile.salary_day, daysInMonth(d.getFullYear(), d.getMonth())));
      d.setHours(10, 0, 0, 0);
      if (d <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate(lang, 'salary.notificationTitle'),
          body: translate(lang, 'salary.notificationBody'),
          data: { url: `/salary?month=${toISODate(d).slice(0, 8)}01` },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: CHANNEL },
      });
    }
  }
}
