# 📦 Paycal - Dijital Abonelik Takipçisi

Netflix, Spotify, ChatGPT ve daha fazlası için akıllı abonelik yönetimi.

## 🚀 Özellikler

- ✅ Abonelik ekleme ve yönetimi
- 📊 Kullanım analizi
- 💰 Aylık maliyet hesaplama
- ⚠️ Fiyat artışı uyarıları
- 📈 "Kullanmıyorsun" analizi
- 🎯 Premium özellikler
- 🤝 Arkadaşlık sistemi ve Keşfet paneli

## 🛠️ Teknolojiler

### Backend
- Node.js + Express
- PostgreSQL (Supabase)
- JWT Authentication
- Node-cron (otomatik kontroller)

### Frontend
- React Native (Expo)
- React Native Web support
- Expo Linear Gradient

## 📦 Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
cd mobile && npm install
```

2. Environment değişkenlerini ayarlayın (.env dosyası ana dizinde olmalı):
```bash
DATABASE_URL=senin_supabase_url
JWT_SECRET=senin_gizli_anahtarin
```

3. Uygulamayı başlatın:

**Backend:**
```bash
npm run server
```

**Frontend (Web):**
```bash
cd mobile && npx expo start --web
```

**Frontend (Mobile):**
```bash
cd mobile && npx expo start
```

## 📄 Lisans
MIT
