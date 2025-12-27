import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function InviteLinkScreen({ route, navigation }) {
  const { token } = route.params;
  const { API_URL } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/invite/user/${token}`);
      setUser(response.data.user);
    } catch (error) {
      Alert.alert(
        'Hata',
        error.response?.data?.error || 'Davet linki geçersiz',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    setSending(true);
    try {
      await axios.post(`${API_URL}/invite/accept/${token}`);
      Alert.alert(
        'Başarılı! 🎉',
        'Arkadaş isteği gönderildi',
        [
          { 
            text: 'Tamam', 
            onPress: () => navigation.navigate('Dashboard', { screen: 'Profile' }) 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'İstek gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#a855f7" />
        </LinearGradient>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (user.is_friend) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <View style={styles.content}>
            <Text style={styles.icon}>✓</Text>
            <Text style={styles.title}>Zaten Arkadaşsınız</Text>
            <Text style={styles.message}>
              {user.name || user.email} ile zaten arkadaşsınız!
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Dashboard', { screen: 'Profile' })}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Profile Git</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (user.has_pending_request) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <View style={styles.content}>
            <Text style={styles.icon}>⏳</Text>
            <Text style={styles.title}>İstek Zaten Gönderilmiş</Text>
            <Text style={styles.message}>
              {user.name || user.email} ile aranızda zaten bir arkadaşlık isteği var!
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Dashboard', { screen: 'Profile' })}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Profile Git</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.userIcon}>
            <Text style={styles.userIconText}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>Arkadaş Daveti</Text>
          <Text style={styles.userName}>{user.name || user.email.split('@')[0]}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.message}>
            Paycal'da arkadaş olmak istiyor!
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={sendFriendRequest}
              disabled={sending}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.buttonGradient}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Arkadaş Ekle</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  userIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  userIconText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


