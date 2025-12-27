import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProfileScreen({ navigation }) {
  const { user, logout, API_URL } = useAuth();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({
    profile_public: true,
    show_subscriptions: true,
    show_spending: false,
    allow_friend_requests: true,
  });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchSettings();
    fetchInviteLink();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/me`);
      setProfile(response.data.profile);
      setNewName(response.data.profile.name || '');
    } catch (error) {
      console.error('Profil alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/settings/privacy`);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Ayarlar alınırken hata:', error);
    }
  };

  const fetchInviteLink = async () => {
    try {
      const response = await axios.get(`${API_URL}/invite/token`);
      setInviteLink(response.data.link);
    } catch (error) {
      console.error('Davet linki alınırken hata:', error);
    }
  };

  const copyInviteLink = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Kopyalandı', 'Davet linki panoya kopyalandı!');
    } catch (error) {
      Alert.alert('Hata', 'Link kopyalanamadı');
    }
  };

  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Paycal'da arkadaş ol! ${inviteLink}`,
        title: 'Paycal Daveti',
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const updateName = async () => {
    if (!newName || newName.trim().length < 2) {
      Alert.alert('Hata', 'İsim en az 2 karakter olmalı');
      return;
    }

    try {
      await axios.put(`${API_URL}/profile/me`, { name: newName.trim() });
      setEditingName(false);
      fetchProfile();
      Alert.alert('Başarılı', 'İsim güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'İsim güncellenemedi');
    }
  };

  const updateSettings = async (key, value) => {
    try {
      await axios.put(`${API_URL}/profile/settings/privacy`, { [key]: value ? 1 : 0 });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar güncellenemedi');
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
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
            <Text style={styles.headerTitle}>Profil</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>
                  {(profile?.name || profile?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              
              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="İsminizi girin"
                    placeholderTextColor="#9ca3af"
                    autoFocus
                  />
                  <View style={styles.nameEditActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingName(false)}>
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={updateName}>
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Text style={styles.profileName}>
                    {profile?.name || 'İsim Belirle'}
                  </Text>
                  <Text style={styles.profileEmail}>{profile?.email}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            {profile?.stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.stats.subscription_count}</Text>
                  <Text style={styles.statLabel}>Abonelik</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₺{profile.stats.total_monthly?.toFixed(2) || '0.00'}</Text>
                  <Text style={styles.statLabel}>Aylık Toplam</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.stats.friend_count}</Text>
                  <Text style={styles.statLabel}>Arkadaş</Text>
                </View>
              </View>
            )}
          </View>

          {/* Invite Link Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 Arkadaş Davet Et</Text>
            <View style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>Link ile Arkadaş Ekle</Text>
              <Text style={styles.inviteDesc}>
                Davet linkini paylaşarak kolayca arkadaş ekle
              </Text>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={copyInviteLink}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={styles.inviteButtonGradient}
                  >
                    <Text style={styles.inviteButtonIcon}>📋</Text>
                    <Text style={styles.inviteButtonText}>Linki Kopyala</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={shareInviteLink}
                >
                  <LinearGradient
                    colors={['#a855f7', '#ec4899']}
                    style={styles.inviteButtonGradient}
                  >
                    <Text style={styles.inviteButtonIcon}>📤</Text>
                    <Text style={styles.inviteButtonText}>Paylaş</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Friends Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Friends')}
            >
              <Text style={styles.menuIcon}>👥</Text>
              <Text style={styles.menuText}>Arkadaşlarım</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Gizlilik Politikası</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gizlilik Ayarları</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Profil Herkese Açık</Text>
                <Text style={styles.settingDesc}>Arkadaş olmayan kişiler profilini görebilir</Text>
              </View>
              <Switch
                value={settings.profile_public}
                onValueChange={(value) => updateSettings('profile_public', value)}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.profile_public ? '#fff' : '#9ca3af'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Abonelik Sayısını Göster</Text>
                <Text style={styles.settingDesc}>Arkadaşların kaç aboneliğin olduğunu görebilir</Text>
              </View>
              <Switch
                value={settings.show_subscriptions}
                onValueChange={(value) => updateSettings('show_subscriptions', value)}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.show_subscriptions ? '#fff' : '#9ca3af'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Harcama Tutarını Göster</Text>
                <Text style={styles.settingDesc}>Arkadaşların toplam harcamanı görebilir</Text>
              </View>
              <Switch
                value={settings.show_spending}
                onValueChange={(value) => updateSettings('show_spending', value)}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.show_spending ? '#fff' : '#9ca3af'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Arkadaş İsteklerine Açık</Text>
                <Text style={styles.settingDesc}>Diğer kullanıcılar sana istek gönderebilir</Text>
              </View>
              <Switch
                value={settings.allow_friend_requests}
                onValueChange={(value) => updateSettings('allow_friend_requests', value)}
                trackColor={{ false: '#374151', true: '#a855f7' }}
                thumbColor={settings.allow_friend_requests ? '#fff' : '#9ca3af'}
              />
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileIconText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  nameEditContainer: {
    width: '100%',
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  nameEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  inviteCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  inviteDesc: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inviteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  inviteButtonIcon: {
    fontSize: 18,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

