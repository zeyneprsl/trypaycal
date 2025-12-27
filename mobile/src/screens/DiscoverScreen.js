import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function DiscoverScreen({ navigation }) {
  const { API_URL } = useAuth();
  const [activities, setActivities] = useState([]);
  const [popular, setPopular] = useState([]);
  const [communityRecs, setCommunityRecs] = useState([]);
  const [targetGroup, setTargetGroup] = useState('');
  const [affiliateOffers, setAffiliateOffers] = useState([]);
  const [weeklyFeatured, setWeeklyFeatured] = useState([]);
  const [frequentlyTogether, setFrequentlyTogether] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, popularRes, communityRes, offersRes, weeklyRes, frequentlyRes] = await Promise.all([
        axios.get(`${API_URL}/discover/feed?limit=20`),
        axios.get(`${API_URL}/discover/popular`),
        axios.get(`${API_URL}/recommendations/community`).catch(() => ({ data: { recommendations: [], target_group: '' } })),
        axios.get(`${API_URL}/recommendations/offers`).catch(() => ({ data: { offers: [] } })),
        axios.get(`${API_URL}/discover/weekly-featured`).catch(() => ({ data: { featured: [] } })),
        axios.get(`${API_URL}/recommendations/frequently-together`).catch(() => ({ data: { suggestions: [] } })),
      ]);
      setActivities(activitiesRes.data.activities || []);
      setPopular(popularRes.data.popular || []);
      setCommunityRecs(communityRes.data.recommendations || []);
      setTargetGroup(communityRes.data.target_group || '');
      setAffiliateOffers(offersRes.data.offers || []);
      setWeeklyFeatured(weeklyRes.data.featured || []);
      setFrequentlyTogether(frequentlyRes.data.suggestions || []);
      
      // Her featured item için impression kaydı gönder
      if (weeklyRes.data.featured && weeklyRes.data.featured.length > 0) {
        weeklyRes.data.featured.forEach(item => {
          axios.post(`${API_URL}/discover/weekly-featured/${item.id}/impression`).catch(err => {
            console.error('Impression tracking error:', err);
          });
        });
      }
    } catch (error) {
      console.error('Keşfet verisi alınırken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFeaturedClick = async (item) => {
    try {
      // Click tracking
      await axios.post(`${API_URL}/discover/weekly-featured/${item.id}/click`);
      
      // Linki aç
      const url = item.affiliate_link;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Link açılamadı');
      }
    } catch (error) {
      console.error('Link opening error:', error);
      Alert.alert('Hata', 'Link açılırken bir sorun oluştu');
    }
  };

  const handleOfferClick = async (offer) => {
    try {
      // Click tracking
      await axios.post(`${API_URL}/recommendations/track-click`, {
        offer_id: offer.id,
        service_name: offer.service_name
      });
      
      // Affiliate linkini backend'den al
      const linkRes = await axios.get(`${API_URL}/recommendations/affiliate-link/${offer.service_name}`);
      const url = linkRes.data.affiliate_link;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Link açılamadı');
      }
    } catch (error) {
      console.error('Offer link error:', error);
      Alert.alert('Hata', 'Link açılırken bir sorun oluştu');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getActivityMessage = (activity) => {
    const userName = activity.user_name || activity.user_email.split('@')[0];
    
    switch (activity.activity_type) {
      case 'subscription_added':
        return `${userName}, ${activity.subscription_name} ekledi`;
      case 'subscription_used':
        return `${userName}, ${activity.subscription_name} kullandı`;
      default:
        return `${userName} bir aktivite gerçekleştirdi`;
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return `${Math.floor(diffInSeconds / 604800)} hafta önce`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e1b4b']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b']}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Keşfet</Text>
            <Text style={styles.headerSubtitle}>Arkadaşlarının neler yaptığını gör</Text>
          </View>

          {/* Haftanın Önerisi - Sponsorlu */}
          {weeklyFeatured.length > 0 && (
            <View style={styles.section}>
              <View style={styles.featuredHeader}>
                <Text style={styles.sectionTitle}>⭐ Haftanın Önerisi</Text>
                <View style={styles.sponsoredBadge}>
                  <Text style={styles.sponsoredText}>SPONSORLU</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.featuredScroll}
              >
                {weeklyFeatured.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.featuredCard}
                    onPress={() => handleFeaturedClick(item)}
                  >
                    <LinearGradient
                      colors={['#7c3aed', '#db2777']}
                      style={styles.featuredGradient}
                    >
                      {/* Icon/Badge */}
                      <View style={styles.featuredIconContainer}>
                        <Text style={styles.featuredIcon}>{item.icon}</Text>
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredBadgeText}>{item.category}</Text>
                        </View>
                      </View>

                      {/* Content */}
                      <Text style={styles.featuredName}>{item.service_name}</Text>
                      <Text style={styles.featuredDescription} numberOfLines={2}>
                        {item.description}
                      </Text>

                      {/* Price */}
                      <View style={styles.featuredPriceContainer}>
                        <Text style={styles.featuredPrice}>
                          {item.currency}{item.price}
                          <Text style={styles.featuredCycle}>/{item.billing_cycle === 'Aylık' ? 'ay' : 'yıl'}</Text>
                        </Text>
                      </View>

                      {/* Discount - Sadece doğrulanmış teklifler */}
                      {item.discount_text && (
                        <View style={styles.featuredDiscount}>
                          <Text style={styles.featuredDiscountText}>🎉 {item.discount_text}</Text>
                        </View>
                      )}

                      {/* CTA Button */}
                      <View style={styles.featuredButton}>
                        <Text style={styles.featuredButtonText}>İncele →</Text>
                      </View>

                      {/* Sponsor Info */}
                      <Text style={styles.featuredSponsor}>
                        Sponsorlu · {item.sponsor_company}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Senin İçin Öneriler - Frequently Together */}
          {frequentlyTogether.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Senin İçin Öneriler</Text>
              <Text style={styles.sectionSubtitle}>
                Aboneliklerine benzer kullanıcıların tercihleri
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.popularScroll}
              >
                {frequentlyTogether.map((item, index) => (
                  <View key={index} style={[styles.popularCard, styles.suggestionCard]}>
                    <View style={styles.suggestionBadge}>
                      <Text style={styles.suggestionBadgeText}>%{item.percentage}</Text>
                    </View>
                    <Text style={styles.popularName}>{item.subscription_name}</Text>
                    <Text style={styles.popularPrice}>
                      {item.currency}{item.avg_price?.toFixed(2)}
                      <Text style={styles.popularPeriod}>/ay</Text>
                    </Text>
                    <Text style={styles.statExplanation} numberOfLines={2}>
                      {item.explanation}
                    </Text>
                    {item.based_on && (
                      <Text style={styles.basedOnText}>
                        📊 {item.based_on}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              <Text style={styles.disclaimerText}>
                ℹ️ Sadece anonim sayma ve gruplama kullanılarak hesaplanmıştır
              </Text>
            </View>
          )}

          {/* Topluluk Önerileri */}
          {communityRecs.length > 0 && targetGroup && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ✨ {targetGroup} Favorileri
              </Text>
              <Text style={styles.sectionSubtitle}>
                Bu öneriler anonim istatistiklere dayanır
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.popularScroll}
              >
                {communityRecs.map((item, index) => (
                  <View key={index} style={[styles.popularCard, styles.communityCard]}>
                    <View style={styles.popularHeader}>
                      <Text style={styles.popularName}>{item.subscription_name}</Text>
                      <View style={styles.communityBadge}>
                        <Text style={styles.communityCount}>
                          {item.percentage ? `%${item.percentage}` : `${item.user_count} kişi`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.popularPrice}>
                      {item.currency}{item.avg_price?.toFixed(2)}
                      <Text style={styles.popularPeriod}>/ay</Text>
                    </Text>
                    {item.explanation && (
                      <Text style={styles.statExplanation} numberOfLines={2}>
                        {item.explanation}
                      </Text>
                    )}
                    {!item.explanation && item.users && item.users.length > 0 && (
                      <Text style={styles.popularFriends} numberOfLines={1}>
                        {item.users.slice(0, 2).join(', ')} kullanıyor
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Affiliate Teklifleri */}
          {affiliateOffers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎁 Özel Teklifler</Text>
              {affiliateOffers.map((offer, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.offerCard}
                  onPress={() => handleOfferClick(offer)}
                >
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>SPONSORLU</Text>
                  </View>
                  <Text style={styles.offerTitle}>{offer.service_name}</Text>
                  {offer.discount_text && (
                    <Text style={styles.offerDiscount}>{offer.discount_text}</Text>
                  )}
                  {offer.target_audience && (
                    <Text style={styles.offerAudience}>{offer.target_audience}</Text>
                  )}
                  <View style={styles.offerButton}>
                    <Text style={styles.offerButtonText}>Teklifi Gör →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popüler Abonelikler */}
          {popular.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Arkadaşlarında Popüler</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.popularScroll}
              >
                {popular.map((item, index) => (
                  <View key={index} style={styles.popularCard}>
                    <View style={styles.popularHeader}>
                      <Text style={styles.popularName}>{item.subscription_name}</Text>
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularCount}>{item.friend_count} kişi</Text>
                      </View>
                    </View>
                    <Text style={styles.popularPrice}>
                      {item.subscription_currency}{item.subscription_price}
                      <Text style={styles.popularPeriod}>/ay</Text>
                    </Text>
                    {item.friend_names && item.friend_names.length > 0 && (
                      <Text style={styles.popularFriends} numberOfLines={1}>
                        {item.friend_names.slice(0, 2).join(', ')}
                        {item.friend_names.length > 2 && ` +${item.friend_names.length - 2}`}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Aktivite Akışı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Son Aktiviteler</Text>
            
            {activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>Henüz aktivite yok</Text>
                <Text style={styles.emptySubtext}>
                  Arkadaş ekleyerek onların aktivitelerini görebilirsin
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityIconText}>
                      {activity.activity_type === 'subscription_added' ? '➕' : '✓'}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMessage}>
                      {getActivityMessage(activity)}
                    </Text>
                    {activity.subscription_price && (
                      <Text style={styles.activityDetail}>
                        {activity.subscription_currency}{activity.subscription_price}/ay
                      </Text>
                    )}
                    <Text style={styles.activityTime}>
                      {getTimeAgo(activity.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Yasal Disclaimer */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              ⓘ Fiyatlar ve teklifler ilgili servis sağlayıcı tarafından belirlenir. 
              Güncel bilgi için lütfen servisin resmi sitesini ziyaret edin. 
              Paycal aracı bir platformdur.
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  communityCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  communityBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  communityCount: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  offerCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    position: 'relative',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  offerDiscount: {
    fontSize: 16,
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: 4,
  },
  offerAudience: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  offerButtonText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popularScroll: {
    paddingLeft: 24,
  },
  popularCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  popularName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  popularBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularCount: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  popularPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 4,
  },
  popularPeriod: {
    fontSize: 12,
    color: '#9ca3af',
  },
  popularFriends: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statExplanation: {
    fontSize: 11,
    color: '#a855f7',
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    position: 'relative',
  },
  suggestionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  suggestionBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  basedOnText: {
    fontSize: 10,
    color: '#6366f1',
    marginTop: 8,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9ca3af',
    paddingHorizontal: 24,
    marginTop: 12,
    fontStyle: 'italic',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '500',
  },
  activityDetail: {
    fontSize: 12,
    color: '#a855f7',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
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
  // Weekly Featured Styles
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 12,
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  sponsoredText: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  featuredScroll: {
    paddingLeft: 24,
  },
  featuredCard: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredGradient: {
    width: 280,
    padding: 20,
    minHeight: 320,
  },
  featuredIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featuredIcon: {
    fontSize: 48,
  },
  featuredBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  featuredName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuredPriceContainer: {
    marginBottom: 12,
  },
  featuredPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  featuredCycle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  featuredDiscount: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  featuredDiscountText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  featuredButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  featuredSponsor: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  legalSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 48,
  },
  legalText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

