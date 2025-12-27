import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  registerForPushNotificationsAsync,
  scheduleRenewalReminder,
  scheduleTodayReminders,
} from '../utils/notifications';

const POPULAR_SUBSCRIPTIONS = [
  { name: 'Paycal Premium (Aylık)', price: '20', currency: '₺', category: 'Uygulama' },
  { name: 'Paycal Premium (Yıllık)', price: '199', currency: '₺', category: 'Uygulama' },
  { name: 'Netflix', price: '349.99', currency: '₺', category: 'Eğlence' },
  { name: 'Spotify', price: '54.99', currency: '₺', category: 'Müzik' },
  { name: 'YouTube Premium', price: '39.99', currency: '₺', category: 'Eğlence' },
  { name: 'Disney+', price: '114.99', currency: '₺', category: 'Eğlence' },
  { name: 'ChatGPT Plus', price: '20', currency: '$', category: 'Yapay Zeka' },
  { name: 'Google Drive', price: '99.99', currency: '₺', category: 'Depolama' },
  { name: 'Dropbox', price: '11.99', currency: '$', category: 'Depolama' },
  { name: 'iCloud+', price: '29.99', currency: '₺', category: 'Depolama' },
  { name: 'Amazon Prime', price: '39', currency: '₺', category: 'Eğlence' },
  { name: 'Apple Music', price: '64.99', currency: '₺', category: 'Müzik' },
  { name: 'Adobe Creative Cloud', price: '54.99', currency: '$', category: 'Tasarım' },
  { name: 'Microsoft 365', price: '269', currency: '₺', category: 'Ofis' },
  { name: 'LinkedIn Premium', price: '29.99', currency: '$', category: 'İş' },
];

// Servis logoları için emoji mapping
const SERVICE_ICONS = {
  'Paycal Premium (Aylık)': '👑',
  'Paycal Premium (Yıllık)': '👑',
  'Paycal Premium': '👑',
  'Netflix': '🎬',
  'Spotify': '🎵',
  'YouTube Premium': '▶️',
  'Disney+': '✨',
  'ChatGPT Plus': '🤖',
  'Google Drive': '📁',
  'Dropbox': '📦',
  'iCloud+': '☁️',
  'Amazon Prime': '📦',
  'Apple Music': '🎶',
  'Adobe Creative Cloud': '🎨',
  'Microsoft 365': '📊',
  'LinkedIn Premium': '💼',
  'LinkedIn': '💼',
};

// Servis adına göre logo/emoji döndür
const getServiceIcon = (serviceName) => {
  return SERVICE_ICONS[serviceName] || serviceName.charAt(0).toUpperCase();
};

export default function DashboardScreen({ navigation, route }) {
  const { user, logout, API_URL } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [newSub, setNewSub] = useState({
    name: '',
    price: '',
    currency: '₺',
    category: 'Eğlence',
    billing_day: '',
    is_private: false, // Gizlilik ayarı
  });
  const [usageStats, setUsageStats] = useState({});

  useEffect(() => {
    fetchData();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const granted = await registerForPushNotificationsAsync();
    if (granted) {
      console.log('Bildirimler etkinleştirildi');
    }
  };

  const fetchData = async () => {
    try {
      const [subsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/subscriptions`),
        axios.get(`${API_URL}/analytics/summary`),
      ]);
      setSubscriptions(subsRes.data.subscriptions);
      setAnalytics(analyticsRes.data);
      
      // Bildirimleri planla
      await scheduleTodayReminders(subsRes.data.subscriptions);
      for (const sub of subsRes.data.subscriptions) {
        await scheduleRenewalReminder(sub);
      }
    } catch (error) {
      Alert.alert('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const addSubscription = async () => {
    if (!newSub.name || !newSub.price) {
      Alert.alert('Hata', 'Abonelik adı ve fiyatı gereklidir');
      return;
    }

    try {
      let next_billing_date = null;
      if (newSub.billing_day) {
        const day = parseInt(newSub.billing_day);
        if (day >= 1 && day <= 31) {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const billingDate = new Date(year, month, day);
          if (billingDate < today) {
            billingDate.setMonth(billingDate.getMonth() + 1);
          }
          next_billing_date = billingDate.toISOString().split('T')[0];
        }
      }
      
      await axios.post(`${API_URL}/subscriptions`, {
        ...newSub,
        price: parseFloat(newSub.price),
        color: 'bg-purple-500',
        next_billing_date,
      });
      setShowAddModal(false);
      setIsCustom(false);
      setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence', billing_day: '', is_private: false });
      fetchData();
    } catch (error) {
      if (error.response?.data?.upgrade_required) {
        Alert.alert(
          'Premium Gerekli 👑',
          'Ücretsiz kullanıcılar en fazla 5 abonelik takip edebilir. Sınırsız takip için Premium\'a geçin!',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Premium\'a Geç',
              onPress: () => {
                setShowAddModal(false);
                navigation.navigate('Premium');
              }
            }
          ]
        );
      } else {
        Alert.alert('Hata', error.response?.data?.message || 'Abonelik eklenirken hata oluştu');
      }
    }
  };

  const deleteSubscription = async (id) => {
    Alert.alert(
      'Emin misiniz?',
      'Bu aboneliği silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/subscriptions/${id}`);
              fetchData();
            } catch (error) {
              Alert.alert('Hata', 'Abonelik silinirken hata oluştu');
            }
          },
        },
      ]
    );
  };

  const [justMarkedUsed, setJustMarkedUsed] = useState(null);

  const markAsUsed = async (id) => {
    try {
      await axios.post(`${API_URL}/subscriptions/${id}/usage`);
      setJustMarkedUsed(id);
      setTimeout(() => setJustMarkedUsed(null), 2000); // 2 saniye sonra normal renge dön
      fetchData();
    } catch (error) {
      Alert.alert('Hata', 'Kullanım kaydedilemedi');
    }
  };

  const getDaysUntilRenewal = (date) => {
    if (!date) return null;
    const today = new Date();
    const renewal = new Date(date);
    const diff = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatLastUsed = (date) => {
    if (!date) return 'Hiç kullanılmadı';
    const daysPassed = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysPassed === 0) return 'Bugün kullanıldı';
    if (daysPassed === 1) return 'Dün kullanıldı';
    if (daysPassed > 30) return `${daysPassed} gün önce (Az kullanılıyor!)`;
    return `${daysPassed} gün önce`;
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#581c87', '#0f172a']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#581c87', '#0f172a']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Paycal</Text>
            <Text style={styles.headerSubtitle}>
              Hoş geldin, {user?.name || user?.email}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {!user?.is_premium && (
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.premiumButtonGradient}
                >
                  <Text style={styles.premiumButtonIcon}>👑</Text>
                  <Text style={styles.premiumButtonText}>Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(236, 72, 153, 0.2)']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statLabel}>Aylık Toplam</Text>
              <Text style={styles.statValue}>₺{analytics?.totalMonthly || '0.00'}</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(6, 182, 212, 0.2)']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statLabel}>Aktif Abonelik</Text>
              <Text style={styles.statValue}>{analytics?.totalSubscriptions || 0}</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(249, 115, 22, 0.2)', 'rgba(239, 68, 68, 0.2)']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statLabel}>Az Kullanılan</Text>
              <Text style={styles.statValue}>{analytics?.underusedCount || 0}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Subscriptions List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aboneliklerim</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setShowAddModal(true);
                setIsCustom(false);
                setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence', billing_day: '', is_private: false });
              }}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addButtonText}>+ Yeni</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Henüz aboneliğiniz yok</Text>
            </View>
          ) : (
            subscriptions.map((sub) => {
              const daysUntil = getDaysUntilRenewal(sub.next_billing_date);
              const isUpcoming = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;
              const isOverdue = daysUntil !== null && daysUntil < 0;
              
              return (
                <View key={sub.id} style={styles.subCard}>
                  <View style={styles.subCardContent}>
                    <View style={styles.subCardTop}>
                      <View style={styles.subCardLeft}>
                        <View style={styles.subIcon}>
                          <Text style={styles.subIconText}>{getServiceIcon(sub.name)}</Text>
                        </View>
                        <View style={styles.subInfo}>
                          <Text style={styles.subName}>{sub.name}</Text>
                          <Text style={styles.subCategory}>{sub.category}</Text>
                          {daysUntil !== null && (
                            <Text style={[
                              styles.renewalText,
                              isOverdue && styles.renewalOverdue,
                              isUpcoming && styles.renewalUpcoming
                            ]}>
                              {isOverdue 
                                ? `${Math.abs(daysUntil)} gün gecikti!` 
                                : daysUntil === 0 
                                  ? 'Bugün yenilenecek!' 
                                  : `${daysUntil} gün sonra yenilenecek`}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.subCardRight}>
                        <Text style={styles.subPrice}>
                          {sub.currency}
                          {sub.price}
                        </Text>
                        <TouchableOpacity
                          onPress={() => deleteSubscription(sub.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Usage Info & Button */}
                    <View style={styles.subCardBottom}>
                      <View>
                        <Text style={styles.lastUsedText}>
                          {formatLastUsed(sub.last_used)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Calendar', { subscriptionId: sub.id, subscriptionName: sub.name })}
                        >
                          <Text style={styles.viewCalendarText}>📅 Takvimi gör</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.usedButton,
                          justMarkedUsed === sub.id && styles.usedButtonActive
                        ]}
                        onPress={() => markAsUsed(sub.id)}
                      >
                        <Text style={[
                          styles.usedButtonText,
                          justMarkedUsed === sub.id && styles.usedButtonTextActive
                        ]}>
                          {justMarkedUsed === sub.id ? '✓ Kaydedildi!' : '✓ Kullandım'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Abonelik Ekle</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setIsCustom(false);
                  setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence', billing_day: '', is_private: false });
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!isCustom && !newSub.name ? (
                // Popüler abonelikler
                <View>
                  <Text style={styles.modalLabel}>Popüler Abonelikler</Text>
                  <View style={styles.popularGrid}>
                    {POPULAR_SUBSCRIPTIONS.map((sub, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.popularCard}
                        onPress={() => setNewSub(sub)}
                      >
                        <Text style={styles.popularIcon}>{getServiceIcon(sub.name)}</Text>
                        <Text style={styles.popularName}>{sub.name}</Text>
                        <Text style={styles.popularPrice}>
                          {sub.currency}
                          {sub.price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={() => setIsCustom(true)}
                  >
                    <Text style={styles.customButtonText}>➕ Diğer (Manuel Ekle)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Form
                <View>
                  {newSub.name && !isCustom && (
                    <View style={styles.selectedInfo}>
                      <Text style={styles.selectedText}>✓ {newSub.name} seçildi</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence', billing_day: '' })
                        }
                      >
                        <Text style={styles.changeText}>Değiştir</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isCustom && (
                    <View>
                      <Text style={styles.modalLabel}>Abonelik Adı</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="örn. Netflix, Spotify"
                        placeholderTextColor="#9ca3af"
                        value={newSub.name}
                        onChangeText={(text) => setNewSub({ ...newSub, name: text })}
                      />
                    </View>
                  )}

                  <Text style={styles.modalLabel}>Fiyat</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="99.99"
                    placeholderTextColor="#9ca3af"
                    value={newSub.price}
                    onChangeText={(text) => setNewSub({ ...newSub, price: text })}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.modalLabel}>Para Birimi</Text>
                  <View style={styles.currencyButtons}>
                    {['₺', '$', '€'].map((curr) => (
                      <TouchableOpacity
                        key={curr}
                        style={[
                          styles.currencyButton,
                          newSub.currency === curr && styles.currencyButtonActive,
                        ]}
                        onPress={() => setNewSub({ ...newSub, currency: curr })}
                      >
                        <Text
                          style={[
                            styles.currencyButtonText,
                            newSub.currency === curr && styles.currencyButtonTextActive,
                          ]}
                        >
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.modalLabel}>Kategori</Text>
                  <View style={styles.categoryButtons}>
                    {['Eğlence', 'Müzik', 'Depolama', 'Yapay Zeka', 'Tasarım', 'Ofis'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          newSub.category === cat && styles.categoryButtonActive,
                        ]}
                        onPress={() => setNewSub({ ...newSub, category: cat })}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            newSub.category === cat && styles.categoryButtonTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="veya kendi kategorinizi yazın"
                    placeholderTextColor="#9ca3af"
                    value={!['Eğlence', 'Müzik', 'Depolama', 'Yapay Zeka', 'Tasarım', 'Ofis'].includes(newSub.category) ? newSub.category : ''}
                    onChangeText={(text) => setNewSub({ ...newSub, category: text || 'Eğlence' })}
                  />

                  <Text style={styles.modalLabel}>Aylık Ödeme Günü (İsteğe Bağlı)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Örn: 15 (ayın 15'inde yenilenir)"
                    placeholderTextColor="#9ca3af"
                    value={newSub.billing_day}
                    onChangeText={(text) => setNewSub({ ...newSub, billing_day: text })}
                    keyboardType="numeric"
                    maxLength={2}
                  />

                  {/* Gizlilik Ayarı */}
                  <View style={styles.privacySection}>
                    <View style={styles.privacyInfo}>
                      <Text style={styles.privacyLabel}>🔒 Gizli Tut</Text>
                      <Text style={styles.privacyDesc}>
                        Arkadaşlarınız bu aboneliği Keşfet'te göremez
                      </Text>
                    </View>
                    <Switch
                      value={newSub.is_private}
                      onValueChange={(value) => setNewSub({ ...newSub, is_private: value })}
                      trackColor={{ false: '#374151', true: '#a855f7' }}
                      thumbColor={newSub.is_private ? '#fff' : '#9ca3af'}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    1-31 arası bir gün girin. Sonraki yenileme tarihi otomatik hesaplanacak.
                  </Text>

                  <View style={styles.modalActions}>
                    {(newSub.name || isCustom) && (
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                          setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence', billing_day: '', is_private: false });
                          setIsCustom(false);
                        }}
                      >
                        <Text style={styles.backButtonText}>← Geri</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addSubscription}
                    >
                      <LinearGradient
                        colors={['#a855f7', '#ec4899']}
                        style={styles.addButtonGradient}
                      >
                        <Text style={styles.addButtonText}>Kaydet</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  premiumButtonIcon: {
    fontSize: 14,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 20,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: Platform.OS === 'android' ? 120 : 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexShrink: 0,
  },
  addButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  subCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  subCardContent: {
    flex: 1,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftButtons: {
    flex: 1,
  },
  subCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  subIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subCategory: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  renewalText: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  renewalUpcoming: {
    color: '#fbbf24',
  },
  renewalOverdue: {
    color: '#ef4444',
  },
  lastUsedText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  viewCalendarText: {
    color: '#60a5fa',
    fontSize: 11,
    marginTop: 2,
  },
  usedButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  usedButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  usedButtonText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usedButtonTextActive: {
    color: '#ffffff',
  },
  subCardRight: {
    alignItems: 'flex-end',
  },
  subPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    padding: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e1b4b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  modalLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  popularCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    width: '47%',
    alignItems: 'center',
  },
  popularIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  popularName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  popularPrice: {
    color: '#9ca3af',
    fontSize: 12,
  },
  customButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  customButtonText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedInfo: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  currencyButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#a855f7',
  },
  currencyButtonText: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyButtonTextActive: {
    color: '#fff',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#a855f7',
  },
  categoryButtonText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonGradient: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  privacyInfo: {
    flex: 1,
    marginRight: 12,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  privacyDesc: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
});

