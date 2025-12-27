import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PrivacyPolicyScreen({ navigation }) {
  const { API_URL } = useAuth();
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await axios.get(`${API_URL}/consent/privacy-policy`);
      setPolicy(response.data);
    } catch (error) {
      console.error('Privacy policy alınamadı:', error);
    }
  };

  if (!policy) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Last Updated */}
          <Text style={styles.lastUpdated}>
            Son Güncellenme: {policy.last_updated}
          </Text>

          {/* Sections */}
          {policy.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bu gizlilik politikası, Paycal uygulamasının kullanımı sırasında kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
            </Text>
            <Text style={styles.footerHighlight}>
              🇹🇷 KVKK Uyumlu
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 24,
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a855f7',
    textAlign: 'center',
  },
});


