import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function CalendarScreen({ route }) {
  const { API_URL } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [usageLogs, setUsageLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [showAddUsageModal, setShowAddUsageModal] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [allSubscriptions, setAllSubscriptions] = useState([]); // Tüm abonelikler
  
  // Eğer tek abonelik için açıldıysa
  const routeSubscriptionId = route?.params?.subscriptionId;
  const routeSubscriptionName = route?.params?.subscriptionName;
  
  // Aktif filtre (null = tümü)
  const [filterSubscriptionId, setFilterSubscriptionId] = useState(routeSubscriptionId || null);
  const [filterSubscriptionName, setFilterSubscriptionName] = useState(routeSubscriptionName || null);

  useEffect(() => {
    fetchData();
  }, [filterSubscriptionId]); // Filtre değişince yeniden yükle

  const fetchData = async () => {
    try {
      const subsRes = await axios.get(`${API_URL}/subscriptions`);
      const allSubs = subsRes.data.subscriptions;
      
      // Tüm abonelikleri sakla (filtre için)
      setAllSubscriptions(allSubs);
      
      // Filtre varsa uygula
      let filteredSubs = allSubs;
      if (filterSubscriptionId) {
        filteredSubs = allSubs.filter(sub => sub.id === filterSubscriptionId);
      }
      
      setSubscriptions(filteredSubs);
      
      // Get usage logs for each subscription
      const logs = {};
      for (const sub of filteredSubs) {
        try {
          const usageRes = await axios.get(`${API_URL}/analytics/usage/${sub.id}`);
          logs[sub.id] = usageRes.data.usage || [];
        } catch (error) {
          logs[sub.id] = [];
        }
      }
      setUsageLogs(logs);
      generateMarkedDates(logs, filteredSubs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const generateMarkedDates = (logs, subs) => {
    const marked = {};
    
    // Her gün için kullanılan abonelikleri topla
    const dailyUsage = {}; // { 'date': [{ name, id }, ...] }
    
    Object.entries(logs).forEach(([subId, subLogs]) => {
      const sub = subs.find(s => s.id == subId);
      if (!sub) return;
      
      subLogs.forEach(log => {
        const date = log.date;
        if (!dailyUsage[date]) dailyUsage[date] = [];
        dailyUsage[date].push({ name: sub.name, id: sub.id });
      });
    });
    
    // Her gün için simgeleri oluştur
    Object.entries(dailyUsage).forEach(([date, usedSubs]) => {
      if (!marked[date]) {
        marked[date] = { marked: true };
      }
      // İlk 3 aboneliğin ilk harfini göster
      marked[date].customText = usedSubs
        .slice(0, 3)
        .map(s => s.name.charAt(0).toUpperCase())
        .join('');
      marked[date].customTextColor = '#a855f7';
    });

    // Mark renewal dates
    subs.forEach(sub => {
      if (sub.next_billing_date) {
        const date = sub.next_billing_date;
        if (!marked[date]) {
          marked[date] = { marked: true };
        }
        marked[date].isRenewal = true;
      }
    });

    setMarkedDates(marked);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getUsageForDate = (date) => {
    const usedSubs = [];
    subscriptions.forEach(sub => {
      const logs = usageLogs[sub.id] || [];
      const found = logs.find(log => log.date === date);
      if (found) {
        usedSubs.push({ ...sub, count: found.count });
      }
    });
    return usedSubs;
  };

  const getRenewalsForDate = (date) => {
    return subscriptions.filter(sub => sub.next_billing_date === date);
  };

  const getTotalUsageDays = (subId) => {
    const logs = usageLogs[subId] || [];
    return logs.length;
  };

  const addUsageForDate = async () => {
    if (selectedSubscriptions.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir abonelik seçin');
      return;
    }

    try {
      // Her seçilen abonelik için kullanım kaydı ekle
      for (const subId of selectedSubscriptions) {
        await axios.post(`${API_URL}/subscriptions/${subId}/usage`, {
          used_at: selectedDate + 'T12:00:00', // Seçilen tarihi gönder
        });
      }
      
      Alert.alert('✓ Başarılı', 'Kullanım kayıtları eklendi');
      setShowAddUsageModal(false);
      setSelectedSubscriptions([]);
      fetchData(); // Takvimi yenile
    } catch (error) {
      Alert.alert('Hata', 'Kullanım eklenirken hata oluştu');
    }
  };

  const toggleSubscriptionSelection = (subId) => {
    if (selectedSubscriptions.includes(subId)) {
      setSelectedSubscriptions(selectedSubscriptions.filter(id => id !== subId));
    } else {
      setSelectedSubscriptions([...selectedSubscriptions, subId]);
    }
  };

  const applyFilter = (subId, subName) => {
    setFilterSubscriptionId(subId);
    setFilterSubscriptionName(subName);
    setShowFilterModal(false);
  };

  return (
    <LinearGradient colors={['#0f172a', '#581c87', '#0f172a']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>
                📅 {filterSubscriptionName ? `${filterSubscriptionName} Takvimi` : 'Takvim'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {filterSubscriptionName ? 'Bu aboneliğin kullanım geçmişi' : 'Tüm aboneliklerin kullanım geçmişi'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={styles.filterButtonText}>⚙️ Filtre</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
            <Text style={styles.legendText}>Kullanıldı</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Yenilenecek</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: '#6366f1',
              },
            }}
            dayComponent={({ date, state, marking }) => {
              const isSelected = date.dateString === selectedDate;
              const isToday = date.dateString === new Date().toISOString().split('T')[0];
              const hasUsage = marking?.customText;
              const isRenewal = marking?.isRenewal;
              
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(date.dateString)}
                  style={[
                    styles.dayContainer,
                    isSelected && styles.selectedDay,
                    isToday && styles.todayDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      state === 'disabled' && styles.disabledDay,
                      isSelected && styles.selectedDayText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {date.day}
                  </Text>
                  {hasUsage && (
                    <View style={styles.usageIndicator}>
                      <Text style={styles.usageText}>{marking.customText}</Text>
                    </View>
                  )}
                  {isRenewal && (
                    <View style={styles.renewalDot} />
                  )}
                </TouchableOpacity>
              );
            }}
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: '#9ca3af',
              monthTextColor: '#ffffff',
              arrowColor: '#a855f7',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>

        {/* Selected Date Details */}
        {selectedDate && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            {/* Used subscriptions */}
            {getUsageForDate(selectedDate).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✓ Kullanılan Abonelikler</Text>
                {getUsageForDate(selectedDate).map((sub, index) => (
                  <View key={index} style={styles.subItem}>
                    <View style={styles.subIcon}>
                      <Text style={styles.subIconText}>{sub.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subDetail}>{sub.count}x kullanıldı</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Renewals */}
            {getRenewalsForDate(selectedDate).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔄 Yenilenecekler</Text>
                {getRenewalsForDate(selectedDate).map((sub) => (
                  <View key={sub.id} style={styles.subItem}>
                    <View style={[styles.subIcon, { backgroundColor: '#ef4444' }]}>
                      <Text style={styles.subIconText}>{sub.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subDetail}>
                        {sub.currency}{sub.price}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {getUsageForDate(selectedDate).length === 0 &&
             getRenewalsForDate(selectedDate).length === 0 && (
              <Text style={styles.emptyText}>Bu tarihte aktivite yok</Text>
            )}

            {/* Add Usage Button */}
            <TouchableOpacity
              style={styles.addUsageButton}
              onPress={() => {
                setSelectedSubscriptions([]);
                setShowAddUsageModal(true);
              }}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.addUsageGradient}
              >
                <Text style={styles.addUsageButtonText}>+ Kullanım Ekle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Kullanım İstatistikleri</Text>
          {subscriptions.map((sub) => {
            const usageDays = getTotalUsageDays(sub.id);
            const daysSinceCreated = Math.ceil(
              (new Date() - new Date(sub.created_at)) / (1000 * 60 * 60 * 24)
            );
            const usagePercentage =
              daysSinceCreated > 0 ? Math.round((usageDays / daysSinceCreated) * 100) : 0;

            return (
              <View key={sub.id} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.subIcon}>
                    <Text style={styles.subIconText}>{sub.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.subName}>{sub.name}</Text>
                    <Text style={styles.statDetail}>
                      {usageDays} gün kullanıldı (Son {daysSinceCreated} gün)
                    </Text>
                  </View>
                  <Text style={styles.statPercentage}>{usagePercentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${usagePercentage}%`,
                        backgroundColor:
                          usagePercentage > 50 ? '#22c55e' : usagePercentage > 20 ? '#fbbf24' : '#ef4444',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Usage Modal */}
        <Modal
          visible={showAddUsageModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddUsageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                  })} - Kullanım Ekle
                </Text>
                <TouchableOpacity onPress={() => setShowAddUsageModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Bu gün hangi abonelikleri kullandınız?
              </Text>

              <ScrollView style={styles.subscriptionList}>
                {subscriptions.map((sub) => {
                  const isSelected = selectedSubscriptions.includes(sub.id);
                  const alreadyUsed = selectedDate && getUsageForDate(selectedDate).some(
                    (used) => used.id === sub.id
                  );

                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                        styles.subscriptionItem,
                        isSelected && styles.subscriptionItemSelected,
                        alreadyUsed && styles.subscriptionItemDisabled,
                      ]}
                      onPress={() => !alreadyUsed && toggleSubscriptionSelection(sub.id)}
                      disabled={alreadyUsed}
                    >
                      <View style={styles.subIcon}>
                        <Text style={styles.subIconText}>
                          {sub.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.subInfo}>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subCategory}>{sub.category}</Text>
                      </View>
                      {alreadyUsed && (
                        <View style={styles.alreadyUsedBadge}>
                          <Text style={styles.alreadyUsedText}>✓ Kayıtlı</Text>
                        </View>
                      )}
                      {isSelected && !alreadyUsed && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddUsageModal(false);
                    setSelectedSubscriptions([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    selectedSubscriptions.length === 0 && styles.saveButtonDisabled,
                  ]}
                  onPress={addUsageForDate}
                  disabled={selectedSubscriptions.length === 0}
                >
                  <LinearGradient
                    colors={
                      selectedSubscriptions.length > 0
                        ? ['#a855f7', '#ec4899']
                        : ['#4b5563', '#6b7280']
                    }
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      Kaydet ({selectedSubscriptions.length})
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Abonelik Filtrele</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Hangi aboneliğin takvimini görmek istersiniz?
              </Text>

              <ScrollView style={styles.subscriptionList}>
                {/* Tümü seçeneği */}
                <TouchableOpacity
                  style={[
                    styles.subscriptionItem,
                    !filterSubscriptionId && styles.subscriptionItemSelected,
                  ]}
                  onPress={() => applyFilter(null, null)}
                >
                  <View style={[styles.subIcon, { backgroundColor: '#6366f1' }]}>
                    <Text style={styles.subIconText}>Tümü</Text>
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={styles.subName}>Tüm Abonelikler</Text>
                    <Text style={styles.subCategory}>
                      {allSubscriptions.length} abonelik
                    </Text>
                  </View>
                  {!filterSubscriptionId && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Her abonelik için */}
                {allSubscriptions.map((sub) => {
                  const isSelected = filterSubscriptionId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                        styles.subscriptionItem,
                        isSelected && styles.subscriptionItemSelected,
                      ]}
                      onPress={() => applyFilter(sub.id, sub.name)}
                    >
                      <View style={styles.subIcon}>
                        <Text style={styles.subIconText}>
                          {sub.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.subInfo}>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subCategory}>{sub.category}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  filterButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  filterButtonText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  calendarContainer: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailsContainer: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subDetail: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: Platform.OS === 'android' ? 120 : 80,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statDetail: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  statPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayContainer: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#6366f1',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  dayText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#a855f7',
    fontWeight: 'bold',
  },
  disabledDay: {
    color: '#4b5563',
  },
  usageIndicator: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#a855f7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  usageText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  renewalDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  addUsageButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addUsageGradient: {
    padding: 16,
    alignItems: 'center',
  },
  addUsageButtonText: {
    color: '#fff',
    fontSize: 16,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
    padding: 4,
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 20,
  },
  subscriptionList: {
    maxHeight: 400,
  },
  subscriptionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subscriptionItemSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7',
  },
  subscriptionItemDisabled: {
    opacity: 0.5,
  },
  alreadyUsedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alreadyUsedText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedBadge: {
    backgroundColor: '#a855f7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
