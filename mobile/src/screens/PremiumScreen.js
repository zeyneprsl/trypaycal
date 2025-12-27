import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PremiumScreen({ navigation }) {
  const { user, API_URL } = useAuth();
  const [features, setFeatures] = useState(null);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeatures();
    fetchPremiumStatus();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get(`${API_URL}/premium/features`);
      setFeatures(response.data);
    } catch (error) {
      console.error('Özellikler alınamadı:', error);
    }
  };

  const fetchPremiumStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/premium/status`);
      setPremiumStatus(response.data);
    } catch (error) {
      console.error('Premium durumu alınamadı:', error);
    }
  };

  const subscribeToPremium = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/premium/subscribe`, {
        plan: selectedPlan
      });
      Alert.alert(
        'Tebrikler! 🎉',
        `${response.data.message}\n\nPaycal Premium aboneliğiniz otomatik olarak takip listenize eklendi.`,
        [
          {
            text: 'Harika!',
            onPress: () => {
              fetchPremiumStatus();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'Abonelik başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (!features) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (premiumStatus?.is_premium) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.premiumActiveCard}>
              <Text style={styles.premiumActiveIcon}>👑</Text>
              <Text style={styles.premiumActiveTitle}>Premium Aktif!</Text>
              <Text style={styles.premiumActiveDesc}>
                Tüm premium özelliklere erişiminiz var
              </Text>
              {premiumStatus.expires_at && (
                <Text style={styles.premiumExpires}>
                  Bitiş: {new Date(premiumStatus.expires_at).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </View>

            {/* Premium Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Premium Özellikler</Text>
              {features.premium_monthly.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>👑</Text>
            <Text style={styles.heroTitle}>Premium'a Geç</Text>
            <Text style={styles.heroSubtitle}>
              Sınırsız takip, gelişmiş analitik ve daha fazlası
            </Text>
          </View>

          {/* Plan Selector */}
          <View style={styles.section}>
            <View style={styles.planSelector}>
              <TouchableOpacity
                style={[styles.planButton, selectedPlan === 'monthly' && styles.planButtonActive]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameActive]}>
                  Aylık
                </Text>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>
                  ₺20/ay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planButton, selectedPlan === 'yearly' && styles.planButtonActive]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>2 AY BEDAVA</Text>
                </View>
                <Text style={[styles.planName, selectedPlan === 'yearly' && styles.planNameActive]}>
                  Yıllık
                </Text>
                <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceActive]}>
                  ₺199/yıl
                </Text>
                <Text style={styles.planSave}>(%17 indirim)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features Comparison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Özellik Karşılaştırması</Text>
            
            {/* Free Features */}
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Ücretsiz</Text>
              {features.free.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={[styles.checkIcon, !feature.included && styles.crossIcon]}>
                    {feature.included ? '✓' : '✕'}
                  </Text>
                  <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Premium Features */}
            <View style={[styles.comparisonCard, styles.premiumCard]}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>👑 PREMIUM</Text>
              </View>
              {features.premium_monthly.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.checkIconPremium}>✓</Text>
                  <Text style={styles.featureTextPremium}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Subscribe Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={subscribeToPremium}
              disabled={loading}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.subscribeButtonGradient}
              >
                <Text style={styles.subscribeButtonText}>
                  {loading ? 'İşleniyor...' : `Premium'a Geç - ${selectedPlan === 'monthly' ? '₺20/ay' : '₺199/yıl'}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              * Bu demo bir simülasyondur. Gerçek ödeme alınmaz.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  planButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planButtonActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 4,
  },
  planNameActive: {
    color: '#fff',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  planPriceActive: {
    color: '#a855f7',
  },
  planSave: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  premiumCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#a855f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 16,
    color: '#22c55e',
    marginRight: 12,
    width: 20,
  },
  crossIcon: {
    color: '#9ca3af',
  },
  checkIconPremium: {
    fontSize: 16,
    color: '#a855f7',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  featureTextDisabled: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  featureTextPremium: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  subscribeButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  premiumActiveCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  premiumActiveIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  premiumActiveTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  premiumActiveDesc: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumExpires: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '600',
  },
});

