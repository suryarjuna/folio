import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coupon } from '../constants/types';

// Configure notification behavior for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule expiry notifications for a coupon.
 */
export async function scheduleExpiryNotifications(coupon: Coupon): Promise<void> {
  if (!coupon.expiryDate) return;

  const enabled = await AsyncStorage.getItem('notificationsEnabled');
  if (enabled === 'false') return;

  const daysBeforeStr = await AsyncStorage.getItem('notifyDaysBefore');
  const daysBefore = daysBeforeStr ? parseInt(daysBeforeStr, 10) : 3;

  const expiryDate = new Date(coupon.expiryDate);
  const now = new Date();

  // Schedule main notification (N days before)
  const mainNotifyDate = new Date(expiryDate);
  mainNotifyDate.setDate(mainNotifyDate.getDate() - daysBefore);
  mainNotifyDate.setHours(9, 0, 0, 0);

  if (mainNotifyDate > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${coupon.companyName} coupon expiring`,
        body: `Your ${coupon.discountDescription || 'coupon'} expires in ${daysBefore} days.`,
        data: { couponId: coupon.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: mainNotifyDate,
      },
      identifier: `folio-expiry-${coupon.id}-${daysBefore}day`,
    });
  }

  // Schedule 1-day-before notification
  const oneDayBefore = new Date(expiryDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  if (oneDayBefore > now && daysBefore > 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${coupon.companyName} coupon expires tomorrow!`,
        body: `Don't forget to use your ${coupon.discountDescription || 'coupon'}.`,
        data: { couponId: coupon.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore,
      },
      identifier: `folio-expiry-${coupon.id}-1day`,
    });
  }
}

/**
 * Cancel all notifications for a coupon.
 */
export async function cancelNotifications(couponId: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of all) {
    if (notif.identifier.startsWith(`folio-expiry-${couponId}`)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Extract coupon ID from notification data for deep linking.
 */
export function getCouponIdFromNotification(
  notification: Notifications.Notification
): string | null {
  const data = notification.request.content.data;
  return (data?.couponId as string) ?? null;
}

/**
 * Send a test notification (fires in 5 seconds).
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Folio Test',
      body: 'Notifications are working!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}
