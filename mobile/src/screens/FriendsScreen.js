import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function FriendsScreen() {
  const { API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/list`);
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Arkadaşlar alınırken hata:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        axios.get(`${API_URL}/friends/requests/incoming`),
        axios.get(`${API_URL}/friends/requests/outgoing`),
      ]);
      setIncomingRequests(incoming.data.requests || []);
      setOutgoingRequests(outgoing.data.requests || []);
    } catch (error) {
      console.error('İstekler alınırken hata:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/friends/search?query=${query}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(`${API_URL}/friends/request`, { to_user_id: userId });
      Alert.alert('Başarılı', 'Arkadaş isteği gönderildi');
      searchUsers(searchQuery); // Refresh search results
      fetchRequests(); // Refresh requests
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'İstek gönderilemedi');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/friends/request/${requestId}/accept`);
      Alert.alert('Başarılı', 'Arkadaş isteği kabul edildi');
      fetchFriends();
      fetchRequests();
    } catch (error) {
      Alert.alert('Hata', 'İstek kabul edilemedi');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/friends/request/${requestId}/reject`);
      fetchRequests();
    } catch (error) {
      Alert.alert('Hata', 'İstek reddedilemedi');
    }
  };

  const removeFriend = async (friendId, friendName) => {
    Alert.alert(
      'Arkadaşlığı Sonlandır',
      `${friendName || 'Bu kullanıcı'} ile arkadaşlığı sonlandırmak istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sonlandır',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/friends/${friendId}`);
              fetchFriends();
            } catch (error) {
              Alert.alert('Hata', 'Arkadaşlık sonlandırılamadı');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriends();
    fetchRequests();
  };

  const renderFriendsList = () => (
    <View style={styles.content}>
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Henüz arkadaşın yok</Text>
          <Text style={styles.emptySubtext}>Arama yaparak arkadaş ekle</Text>
        </View>
      ) : (
        friends.map((friend) => (
          <View key={friend.id} style={styles.userCard}>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>
                {(friend.name || friend.email).charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{friend.name || friend.email.split('@')[0]}</Text>
              <Text style={styles.userEmail}>{friend.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFriend(friend.id, friend.name)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderSearch = () => (
    <View style={styles.content}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Email veya isim ara..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchUsers(text);
          }}
          autoCapitalize="none"
        />
      </View>

      {searchResults.map((user) => {
        const isFriend = friends.some((f) => f.id === user.id);
        const hasPendingRequest = outgoingRequests.some((r) => r.to_user_id === user.id);

        return (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || user.email.split('@')[0]}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            {isFriend ? (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText}>Arkadaş</Text>
              </View>
            ) : hasPendingRequest ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>İstek Gönderildi</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => sendFriendRequest(user.id)}
              >
                <Text style={styles.addButtonText}>+ Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderRequests = () => (
    <View style={styles.content}>
      {incomingRequests.length > 0 && (
        <View style={styles.requestSection}>
          <Text style={styles.requestSectionTitle}>Gelen İstekler</Text>
          {incomingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.userIcon}>
                <Text style={styles.userIconText}>
                  {(request.name || request.email).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {request.name || request.email.split('@')[0]}
                </Text>
                <Text style={styles.userEmail}>{request.email}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => acceptRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => rejectRequest(request.id)}
                >
                  <Text style={styles.rejectButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {outgoingRequests.length > 0 && (
        <View style={styles.requestSection}>
          <Text style={styles.requestSectionTitle}>Gönderilen İstekler</Text>
          {outgoingRequests.map((request) => (
            <View key={request.id} style={styles.userCard}>
              <View style={styles.userIcon}>
                <Text style={styles.userIconText}>
                  {(request.name || request.email).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {request.name || request.email.split('@')[0]}
                </Text>
                <Text style={styles.userEmail}>{request.email}</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Bekliyor</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyText}>Bekleyen istek yok</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Arkadaşlar</Text>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                Arkadaşlarım ({friends.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                Ara
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                İstekler {incomingRequests.length > 0 && `(${incomingRequests.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
          }
        >
          {activeTab === 'friends' && renderFriendsList()}
          {activeTab === 'search' && renderSearch()}
          {activeTab === 'requests' && renderRequests()}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#a855f7',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 120 : 100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    color: '#9ca3af',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#a855f7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  friendBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingBadgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  requestSection: {
    marginBottom: 24,
  },
  requestSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

