# 📱 SubTracker Mobile App

React Native + Expo ile geliştirilmiş mobil uygulama. iOS (App Store) ve Android (Google Play) için.

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
cd mobile
npm install
```

### 2. Backend URL'ini Ayarla

`src/context/AuthContext.js` dosyasında API_URL'i değiştir:

```javascript
// Bilgisayarının IP adresini yaz (localhost ÇALIŞMAZ!)
const API_URL = 'http://192.168.1.100:5000/api';
```

**IP Adresini Öğren:**
- Windows: `ipconfig` komutunu çalıştır (IPv4 Address)
- Mac/Linux: `ifconfig` komutunu çalıştır (inet)

### 3. Backend'i Başlat

Başka bir terminalde:
```bash
cd ..
npm run server
```

### 4. Mobil Uygulamayı Başlat

```bash
npm start
```

Bu komut Expo Dev Server'ı başlatır. QR kod gösterecek.

## 📱 Cihazında Çalıştır

### iOS (iPhone/iPad)
1. App Store'dan **Expo Go** indir
2. Expo Go'yu aç
3. QR kodu tara
4. Uygulama yüklenecek

### Android
1. Google Play'den **Expo Go** indir
2. Expo Go'yu aç
3. QR kodu tara
4. Uygulama yüklenecek

## 🖥️ Emülatörde Çalıştır

### iOS Simulator (sadece Mac)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

## 📦 Production Build (App Store & Google Play)

### Gereksinimler
- Expo hesabı (ücretsiz): https://expo.dev
- Apple Developer hesabı ($99/yıl) - iOS için
- Google Play Developer hesabı ($25 bir kerelik) - Android için

### 1. Expo ile Giriş

```bash
npx expo login
```

### 2. iOS Build (App Store için)

```bash
# app.json'da bundleIdentifier ve buildNumber ayarla
eas build --platform ios

# Build tamamlandıktan sonra indir ve App Store Connect'e yükle
```

### 3. Android Build (Google Play için)

```bash
# app.json'da package ve versionCode ayarla
eas build --platform android

# APK veya AAB dosyası oluşturulur
# Google Play Console'a yükle
```

### 4. EAS (Expo Application Services) Kurulumu

```bash
npm install -g eas-cli
eas build:configure
```

## 📝 app.json Ayarları

```json
{
  "expo": {
    "name": "SubTracker",
    "slug": "subtracker",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.subtracker",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourcompany.subtracker",
      "versionCode": 1
    }
  }
}
```

## 🎨 Özellikler

- ✅ Kullanıcı kaydı ve girişi
- ✅ Abonelik ekleme/silme
- ✅ Popüler abonelikler listesi
- ✅ Manuel abonelik ekleme
- ✅ Aylık maliyet hesaplama
- ✅ İstatistik kartları
- ✅ Çoklu para birimi (₺, $, €)
- ✅ Pull-to-refresh
- ✅ Modern gradient UI
- ✅ AsyncStorage ile local veri

## 🔧 Sorun Giderme

### Backend'e bağlanamıyor
- ✅ Backend çalışıyor mu kontrol et
- ✅ IP adresini doğru yazdın mı kontrol et
- ✅ Telefon ve bilgisayar aynı WiFi ağında mı?
- ✅ Firewall backend portunu (5000) engelliyor mu?

### Expo Go çalışmıyor
```bash
# Cache temizle
expo start -c
```

### Build hatası
```bash
# Dependencies güncelle
npm install
# Expo CLI güncelle
npm install -g expo-cli@latest
```

## 📱 App Store Yükleme Adımları

### iOS (App Store)

1. **Apple Developer Hesabı Oluştur** ($99/yıl)
   - https://developer.apple.com

2. **App Store Connect'e Git**
   - https://appstoreconnect.apple.com
   - Yeni App oluştur

3. **Build Oluştur**
   ```bash
   eas build --platform ios
   ```

4. **TestFlight ile Test Et**
   - App Store Connect'te TestFlight sekmesine git
   - Build'i yükle
   - Beta testerlar ekle

5. **App Review'a Gönder**
   - Ekran görüntüleri ekle (gerekli tüm boyutlar)
   - Açıklama yaz
   - Kategori seç
   - Review'a gönder
   - Apple onayı (genellikle 1-3 gün)

### Android (Google Play)

1. **Google Play Developer Hesabı** ($25 bir kerelik)
   - https://play.google.com/console

2. **Yeni App Oluştur**
   - Play Console'da "Create app"

3. **Build Oluştur**
   ```bash
   eas build --platform android
   ```

4. **AAB/APK Yükle**
   - Play Console'da "Release" sekmesine git
   - "Production" veya "Internal testing" seç
   - Build dosyasını yükle

5. **Store Listing Doldur**
   - Ekran görüntüleri (en az 2 adet)
   - Feature graphic
   - Açıklama
   - İkon
   - Kategori

6. **Review'a Gönder**
   - Tüm gerekli alanları doldur
   - Review'a gönder
   - Google onayı (genellikle birkaç saat)

## 📸 Gerekli Görseller

### iOS
- App Icon: 1024x1024px
- Screenshots:
  - 6.5" iPhone: 1284x2778px
  - 5.5" iPhone: 1242x2208px
  - iPad Pro: 2048x2732px

### Android
- App Icon: 512x512px
- Feature Graphic: 1024x500px
- Screenshots: En az 320px genişlik
- Önerilen: 1080x1920px (9:16)

## 🎯 Production Checklist

- [ ] app.json'da doğru bundle ID/package name
- [ ] Icon ve splash screen hazır
- [ ] Backend production URL'i ayarlandı
- [ ] Privacy Policy sayfası hazır
- [ ] Terms of Service hazır
- [ ] Ekran görüntüleri hazır
- [ ] Store açıklaması yazıldı
- [ ] Keywords belirlendi
- [ ] Test edildi (iOS & Android)
- [ ] Analytics eklendi (opsiyonel)
- [ ] Crash reporting eklendi (opsiyonel)

## 🔗 Faydalı Linkler

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Policies: https://play.google.com/about/developer-content-policy/

## 💡 İpuçları

1. **Test Etmeyi Unutma**: Her iki platformda da tam test yap
2. **Privacy Policy**: Store'lar bunu zorunlu kılıyor
3. **Screenshots**: Profesyonel ve çekici olmalı
4. **Keywords**: App keşfi için önemli
5. **Beta Testing**: TestFlight ve Internal Testing kullan
6. **Version Control**: Her release için version number artır
7. **Changelog**: Kullanıcılar ne değişti görmek ister

## 🆘 Destek

Sorun yaşıyorsan:
- Expo Forum: https://forums.expo.dev
- Stack Overflow: `expo` tag'i ile
- GitHub Issues

## 📄 Lisans

MIT

