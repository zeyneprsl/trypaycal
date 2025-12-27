import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Plus, TrendingUp, AlertCircle, DollarSign, Calendar, 
  Trash2, X, Check, LogOut, Crown 
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [underused, setUnderused] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [newSub, setNewSub] = useState({ 
    name: '', 
    price: '', 
    currency: '₺', 
    category: 'Eğlence' 
  });
  const [isCustomSub, setIsCustomSub] = useState(false);

  // Popüler abonelikler listesi
  const popularSubscriptions = [
    { name: 'Netflix', price: '349.99', currency: '₺', category: 'Eğlence' },
    { name: 'Spotify', price: '54.99', currency: '₺', category: 'Müzik' },
    { name: 'YouTube Premium', price: '39.99', currency: '₺', category: 'Eğlence' },
    { name: 'Disney+', price: '114.99', currency: '₺', category: 'Eğlence' },
    { name: 'Amazon Prime', price: '49.90', currency: '₺', category: 'Eğlence' },
    { name: 'Apple Music', price: '54.99', currency: '₺', category: 'Müzik' },
    { name: 'ChatGPT Plus', price: '20', currency: '$', category: 'Yapay Zeka' },
    { name: 'Adobe Creative Cloud', price: '54.99', currency: '$', category: 'Diğer' },
    { name: 'Microsoft 365', price: '299', currency: '₺', category: 'Diğer' },
    { name: 'iCloud+', price: '34.99', currency: '₺', category: 'Bulut Depolama' },
    { name: 'Exxen', price: '99.99', currency: '₺', category: 'Eğlence' },
    { name: 'BluTV', price: '69.99', currency: '₺', category: 'Eğlence' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, analyticsRes, underusedRes] = await Promise.all([
        axios.get('/api/subscriptions'),
        axios.get('/api/analytics/summary'),
        axios.get('/api/analytics/underused')
      ]);

      setSubscriptions(subsRes.data.subscriptions);
      setAnalytics(analyticsRes.data);
      setUnderused(underusedRes.data.subscriptions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async () => {
    if (!newSub.name || !newSub.price) {
      alert('Abonelik adı ve fiyatı gereklidir');
      return;
    }

    try {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500', 'bg-red-500', 'bg-green-500', 'bg-emerald-500'];
      
      await axios.post('/api/subscriptions', {
        ...newSub,
        price: parseFloat(newSub.price),
        color: colors[Math.floor(Math.random() * colors.length)]
      });

      setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence' });
      setIsCustomSub(false);
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      if (error.response?.status === 403) {
        alert(error.response.data.message);
      } else {
        alert('Abonelik eklenirken hata oluştu');
      }
      console.error('Failed to add subscription:', error);
    }
  };

  const deleteSubscription = async (id) => {
    if (!confirm('Bu aboneliği silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`/api/subscriptions/${id}`);
      fetchData();
    } catch (error) {
      alert('Abonelik silinirken hata oluştu');
      console.error('Failed to delete subscription:', error);
    }
  };

  const getLastUsedText = (lastUsed) => {
    if (!lastUsed) return 'Hiç kullanılmadı';
    
    const date = new Date(lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return '1 gün önce';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
  };

  const getUsagePercentage = (lastUsed) => {
    if (!lastUsed) return 10;
    
    const date = new Date(lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(10, 100 - diffDays * 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SubTracker
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Hoş geldin, {user?.name || user?.email} 
                {user?.is_premium && (
                  <span className="ml-2 text-xs bg-amber-500/30 text-amber-400 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Crown size={12} />
                    Premium
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setIsCustomSub(false);
                  setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence' });
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
              >
                <Plus size={20} />
                Abonelik Ekle
              </button>
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-2xl transition-all"
                title="Çıkış Yap"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/30 p-3 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <p className="text-gray-400 text-sm mb-1">Aylık Toplam</p>
            <p className="text-3xl font-bold">
              ₺{analytics?.totalMonthly || '0.00'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/30 p-3 rounded-2xl">
                <Calendar size={24} />
              </div>
              <span className="text-xs bg-blue-500/30 px-3 py-1 rounded-full">Aktif</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Aktif Abonelik</p>
            <p className="text-3xl font-bold">{analytics?.totalSubscriptions || 0}</p>
            {!user?.is_premium && (
              <p className="text-xs text-gray-500 mt-2">
                Maks: 5 (Premium: Sınırsız)
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/30 p-3 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <span className="text-xs bg-orange-500/30 px-3 py-1 rounded-full">Uyarı</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Az Kullanılan</p>
            <p className="text-3xl font-bold">{analytics?.underusedCount || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Abonelikler
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Analiz
          </button>
        </div>

        {/* Subscriptions List */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
                <p className="text-gray-400 text-lg mb-4">Henüz aboneliğiniz yok</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-2xl inline-flex items-center gap-2 font-semibold transition-all transform hover:scale-105"
                >
                  <Plus size={20} />
                  İlk Aboneliğini Ekle
                </button>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${sub.color} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg`}>
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{sub.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-400">{sub.category}</span>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                            Son kullanım: {getLastUsedText(sub.last_used)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {sub.currency}{sub.price}
                          <span className="text-sm text-gray-400 ml-1">/ay</span>
                        </p>
                        {sub.currency === '$' && (
                          <p className="text-xs text-gray-500">≈ ₺{(sub.price * 34).toFixed(2)}</p>
                        )}
                        {sub.currency === '€' && (
                          <p className="text-xs text-gray-500">≈ ₺{(sub.price * 36).toFixed(2)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 p-2 rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-6">📊 Kullanım Analizi</h3>
            {subscriptions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Analiz görmek için önce abonelik ekleyin
              </p>
            ) : (
              <div className="space-y-6">
                {subscriptions.map((sub) => (
                  <div key={sub.id}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">{sub.name}</span>
                      <span className="text-gray-400">{getLastUsedText(sub.last_used)}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${sub.color} h-full rounded-full transition-all duration-1000`}
                        style={{ width: `${getUsagePercentage(sub.last_used)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {underused.length > 0 && (
              <div className="mt-8 p-6 bg-orange-500/20 border border-orange-500/30 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-orange-400 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-orange-400 mb-2">💡 Tasarruf Önerisi</h4>
                    <p className="text-gray-300">
                      {underused[0].name} aboneliğinizi 30 gündür kullanmadınız. 
                      İptal ederek aylık {underused[0].currency}{underused[0].price} tasarruf edebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Banner */}
        {!user?.is_premium && (
          <div className="mt-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Crown className="text-amber-400" size={28} />
                  Premium'a Geçin
                </h3>
                <p className="text-gray-300 mb-4">Sınırsız abonelik takibi, fiyat artışı uyarıları ve gelişmiş analizler</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-400" />
                    Sınırsız abonelik takibi
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-400" />
                    Otomatik fiyat artışı bildirimleri
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-400" />
                    Kullanım tabanlı tasarruf önerileri
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-400" />
                    Gelişmiş bütçe raporları
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-400" />
                    Fintech entegrasyonları
                  </li>
                </ul>
              </div>
              <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50 whitespace-nowrap">
                Premium'u Dene
                <div className="text-xs font-normal mt-1">₺49.99/ay</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Yeni Abonelik Ekle</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsCustomSub(false);
                  setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence' });
                }}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {!isCustomSub && !newSub.name ? (
              // Popüler abonelikler seçim ekranı
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">
                    Popüler Abonelikler - Seçmek için tıklayın
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {popularSubscriptions.map((sub, index) => (
                      <button
                        key={index}
                        onClick={() => setNewSub(sub)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-500 rounded-xl p-4 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            {sub.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {sub.currency}{sub.price}/ay
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {sub.category}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Diğer butonu */}
                  <button
                    onClick={() => setIsCustomSub(true)}
                    className="w-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-xl p-4 font-semibold transition-all text-blue-300 hover:text-blue-200"
                  >
                    ➕ Diğer (Manuel Ekle)
                  </button>
                </div>
              </div>
            ) : (
              // Form ekranı (popüler seçim yapıldıysa veya manuel ekleme seçildiyse)
              <div className="space-y-4">
                {newSub.name && !isCustomSub && (
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">✓ {newSub.name}</span>
                        <span className="text-xs text-gray-400 ml-2">seçildi</span>
                      </div>
                      <button
                        onClick={() => setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence' })}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Değiştir
                      </button>
                    </div>
                  </div>
                )}

                {isCustomSub && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Abonelik Adı
                    </label>
                    <input
                      type="text"
                      value={newSub.name}
                      onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                      placeholder="örn. Crunchyroll, Duolingo"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                      autoFocus
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Fiyat</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSub.price}
                      onChange={(e) => setNewSub({ ...newSub, price: e.target.value })}
                      placeholder="99.99"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Para Birimi</label>
                    <select
                      value={newSub.currency}
                      onChange={(e) => setNewSub({ ...newSub, currency: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                    >
                      <option value="₺" className="bg-slate-800">₺ TL</option>
                      <option value="$" className="bg-slate-800">$ USD</option>
                      <option value="€" className="bg-slate-800">€ EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Kategori</label>
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="Eğlence" className="bg-slate-800">Eğlence</option>
                    <option value="Müzik" className="bg-slate-800">Müzik</option>
                    <option value="Yapay Zeka" className="bg-slate-800">Yapay Zeka</option>
                    <option value="Fitness" className="bg-slate-800">Fitness</option>
                    <option value="Eğitim" className="bg-slate-800">Eğitim</option>
                    <option value="Bulut Depolama" className="bg-slate-800">Bulut Depolama</option>
                    <option value="Diğer" className="bg-slate-800">Diğer</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  {(newSub.name || isCustomSub) && (
                    <button
                      onClick={() => {
                        setNewSub({ name: '', price: '', currency: '₺', category: 'Eğlence' });
                        setIsCustomSub(false);
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-all"
                    >
                      ← Geri
                    </button>
                  )}
                  <button
                    onClick={addSubscription}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

