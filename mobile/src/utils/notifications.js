// Bildirimler Expo Go SDK 53+ ile uyumlu değil
// Production build'de expo-notifications yeniden eklenebilir

console.log('Notifications module loaded (stub mode - will work in production build)');

// Bildirim izni iste
export async function registerForPushNotificationsAsync() {
  console.log('Notifications not available in Expo Go SDK 53+');
  return false;
}

// Yenileme tarihi yaklaşan abonelikler için bildirim planla
export async function scheduleRenewalReminder(subscription) {
  // Stub - production build'de çalışacak
  return;
}

// Bugün yenilenecek abonelikler için bildirim
export async function scheduleTodayReminders(subscriptions) {
  // Stub - production build'de çalışacak
  return;
}

// Az kullanılan abonelikler için haftalık bildirim
export async function scheduleUnderusedReminder() {
  // Stub - production build'de çalışacak
  return;
}

// Tüm bildirimleri iptal et
export async function cancelAllNotifications() {
  // Stub - production build'de çalışacak
  return;
}

// Belirli bir abonelik için bildirimleri iptal et
export async function cancelSubscriptionNotifications(subscriptionId) {
  // Stub - production build'de çalışacak
  return;
}
