import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ConsentScreen({ navigation }) {
  const { API_URL } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Backend'e kaydet
      await axios.post(`${API_URL}/consent/save`, {
        analytics_consent: accepted
      });

      // Local storage'a kaydet
      await AsyncStorage.setItem('consent_shown', 'true');
      await AsyncStorage.setItem('analytics_consent', accepted ? 'true' : 'false');

      // Onboarding'e git
      navigation.replace('Onboarding');
    } catch (error) {
      console.error('Consent kaydedilemedi:', error);
      // Hata olsa bile devam et
      await AsyncStorage.setItem('consent_shown', 'true');
      navigation.replace('Dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Gizliliğiniz Önemli</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Paycal'i daha iyi hale getirmek için yardımınıza ihtiyacımız var.
          </Text>

          {/* Consent Card */}
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>📊 Anonim Kullanım Verileri</Text>
            <Text style={styles.consentDescription}>
              Topluluk istatistikleri ve trend analizleri için anonim kullanım verilerinizi toplayabilir miyiz?
            </Text>

            {/* Features */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Veriler tamamen anonimleştirilir</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Kişisel veri paylaşılmaz</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Sadece istatistik amaçlı kullanılır</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>İstediğiniz zaman iptal edebilirsiniz</Text>
              </View>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAccepted(!accepted)}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Policy Link */}
          <TouchableOpacity onPress={openPrivacyPolicy} style={styles.privacyLink}>
            <Text style={styles.privacyLinkText}>
              🔍 Gizlilik Politikasını Okuyun
            </Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, !accepted && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!accepted || loading}
          >
            <LinearGradient
              colors={accepted ? ['#a855f7', '#ec4899'] : ['#374151', '#4b5563']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Kaydediliyor...' : 'Devam Et'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={async () => {
              await AsyncStorage.setItem('consent_shown', 'true');
              await AsyncStorage.setItem('analytics_consent', 'false');
              navigation.replace('Dashboard');
            }}
          >
            <Text style={styles.skipButtonText}>
              Şimdi Değil (Veri Toplanmayacak)
            </Text>
          </TouchableOpacity>

          {/* KVKK Notice */}
          <Text style={styles.kvkkNotice}>
            🇹🇷 KVKK (Kişisel Verilerin Korunması Kanunu) uyumlu
          </Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  consentCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  consentDescription: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    color: '#22c55e',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  privacyLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  privacyLinkText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '600',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  continueButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  kvkkNotice: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

