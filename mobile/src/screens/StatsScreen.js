import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { user, logout, API_URL } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, subsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/summary`),
        axios.get(`${API_URL}/subscriptions`),
        axios.get(`${API_URL}/analytics/categories`),
      ]);
      setAnalytics(analyticsRes.data);
      setSubscriptions(subsRes.data.subscriptions);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getMostExpensive = () => {
    if (subscriptions.length === 0) return [];
    return [...subscriptions]
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);
  };

  const getCheapest = () => {
    if (subscriptions.length === 0) return [];
    return [...subscriptions]
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  };

  const getYearlyTotal = () => {
    if (!analytics) return 0;
    return (parseFloat(analytics.totalMonthly) * 12).toFixed(2);
  };

  const getCategoryColor = (index) => {
    const colors = ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444'];
    return colors[index % colors.length];
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 İstatistikler</Text>
          <Text style={styles.headerSubtitle}>Detaylı analiz</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.3)', 'rgba(236, 72, 153, 0.3)']}
              style={styles.overviewGradient}
            >
              <Text style={styles.overviewLabel}>Aylık Toplam</Text>
              <Text style={styles.overviewValue}>₺{analytics?.totalMonthly || '0.00'}</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.3)', 'rgba(6, 182, 212, 0.3)']}
              style={styles.overviewGradient}
            >
              <Text style={styles.overviewLabel}>Yıllık Toplam</Text>
              <Text style={styles.overviewValue}>₺{getYearlyTotal()}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategorilere Göre</Text>
            {categories.map((cat, index) => {
              const percentage = analytics?.totalMonthly
                ? Math.round((cat.total / parseFloat(analytics.totalMonthly)) * 100)
                : 0;
              
              return (
                <View key={cat.category} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: getCategoryColor(index) }]}
                      />
                      <Text style={styles.categoryName}>{cat.category}</Text>
                    </View>
                    <Text style={styles.categoryCount}>{cat.count} abonelik</Text>
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryTotal}>₺{cat.total.toFixed(2)}/ay</Text>
                    <Text style={styles.categoryPercentage}>{percentage}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: getCategoryColor(index) },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Most Expensive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 En Pahalılar</Text>
          {getMostExpensive().map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.subIcon}>
                <Text style={styles.subIconText}>{sub.name.charAt(0)}</Text>
              </View>
              <View style={styles.subInfo}>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.subCategory}>{sub.category}</Text>
              </View>
              <Text style={styles.subPrice}>
                {sub.currency}{sub.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Cheapest */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💵 En Ucuzlar</Text>
          {getCheapest().map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={[styles.subIcon, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.subIconText}>{sub.name.charAt(0)}</Text>
              </View>
              <View style={styles.subInfo}>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.subCategory}>{sub.category}</Text>
              </View>
              <Text style={styles.subPrice}>
                {sub.currency}{sub.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Öneriler</Text>
          {analytics?.underusedCount > 0 && (
            <View style={styles.insightCard}>
              <Text style={styles.insightIcon}>⚠️</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Az Kullanılan Abonelikler</Text>
                <Text style={styles.insightText}>
                  {analytics.underusedCount} aboneliğiniz son 30 günde kullanılmadı. İptal ederek
                  tasarruf edebilirsiniz.
                </Text>
              </View>
            </View>
          )}
          {subscriptions.length === 0 && (
            <View style={styles.insightCard}>
              <Text style={styles.insightIcon}>🎉</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>İlk Aboneliğini Ekle</Text>
                <Text style={styles.insightText}>
                  Harcamalarını takip etmeye başla ve paranı akıllıca yönet!
                </Text>
              </View>
            </View>
          )}
          {subscriptions.length > 0 && analytics?.underusedCount === 0 && (
            <View style={styles.insightCard}>
              <Text style={styles.insightIcon}>✨</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Harika Gidiyorsun!</Text>
                <Text style={styles.insightText}>
                  Tüm aboneliklerini aktif olarak kullanıyorsun. Böyle devam et!
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: 24,
    paddingTop: 60,
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
  overviewSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  overviewCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
  },
  overviewLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  overviewValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: Platform.OS === 'android' ? 120 : 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryCount: {
    color: '#9ca3af',
    fontSize: 14,
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    color: '#9ca3af',
    fontSize: 16,
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
  subCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  subPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  insightCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
});

