import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function OnboardingScreen({ navigation }) {
  const { API_URL } = useAuth();
  const [occupations, setOccupations] = useState([]);
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOccupations();
  }, []);

  const fetchOccupations = async () => {
    try {
      const response = await axios.get(`${API_URL}/recommendations/occupations`);
      setOccupations(response.data.occupations);
    } catch (error) {
      console.error('Meslekler alınamadı:', error);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/recommendations/profile`, {
        occupation: selectedOccupation?.name || null,
        is_student: isStudent,
        interests: selectedOccupation?.id || null
      });

      navigation.replace('Dashboard');
    } catch (error) {
      console.error('Profil kaydedilemedi:', error);
      // Hata olsa bile devam et
      navigation.replace('Dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.replace('Dashboard');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>✨</Text>
            <Text style={styles.title}>Sana Özel Öneriler</Text>
            <Text style={styles.description}>
              Senin gibi kişilerin favorilerini görmek ister misin?
            </Text>
          </View>

          {/* Student Toggle */}
          <TouchableOpacity
            style={[styles.studentCard, isStudent && styles.studentCardActive]}
            onPress={() => setIsStudent(!isStudent)}
          >
            <Text style={styles.studentIcon}>🎓</Text>
            <View style={styles.studentInfo}>
              <Text style={[styles.studentTitle, isStudent && styles.studentTitleActive]}>
                Öğrenciyim
              </Text>
              <Text style={styles.studentDesc}>
                Öğrencilere özel indirimler gör
              </Text>
            </View>
            <View style={[styles.checkbox, isStudent && styles.checkboxChecked]}>
              {isStudent && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          {/* Occupations */}
          <Text style={styles.sectionTitle}>
            {isStudent ? 'Hangi Alanda Öğrencisin? (İsteğe Bağlı)' : 'Mesleğini Seç (İsteğe Bağlı)'}
          </Text>
          <View style={styles.occupationsGrid}>
            {occupations.filter(occ => occ.id !== 'student').map((occupation) => (
              <TouchableOpacity
                key={occupation.id}
                style={[
                  styles.occupationCard,
                  selectedOccupation?.id === occupation.id && styles.occupationCardActive
                ]}
                onPress={() => setSelectedOccupation(occupation)}
              >
                <Text style={styles.occupationIcon}>{occupation.icon}</Text>
                <Text style={[
                  styles.occupationName,
                  selectedOccupation?.id === occupation.id && styles.occupationNameActive
                ]}>
                  {occupation.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>🎁 Sana Özel Avantajlar</Text>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                Senin gibi kişilerin favorilerini gör
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                {isStudent ? 'Öğrencilere özel indirimler' : 'Meslek grubuna özel indirimler'}
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                Topluluk önerileri ve sponsorlu teklifler
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={loading}
          >
            <LinearGradient
              colors={['#a855f7', '#ec4899']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Kaydediliyor...' : 'Devam Et'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Daha Sonra</Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  studentCardActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
  },
  studentIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 4,
  },
  studentTitleActive: {
    color: '#fff',
  },
  studentDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  occupationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  occupationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  occupationCardActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
  },
  occupationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  occupationName: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '600',
  },
  occupationNameActive: {
    color: '#fff',
  },
  benefitsCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 16,
    color: '#22c55e',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
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
  },
  skipButtonText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

