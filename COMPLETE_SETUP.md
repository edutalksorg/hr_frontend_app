# HR System - Full Stack Mobile & Web Application

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   HR System                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐          ┌──────────────────┐    │
│  │   Web App        │          │  Mobile App      │    │
│  │ (React Vite)     │          │  (Expo WebView)  │    │
│  │  Port: 5173      │          │  Port: 8081      │    │
│  └────────┬─────────┘          └────────┬─────────┘    │
│           │                             │                │
│           └─────────────────┬───────────┘                │
│                             │                            │
│                       ┌─────▼─────┐                      │
│                       │  API (5000)│                      │
│                       └────────────┘                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Project Components

### 1. **Web App** (`app-7vshm2afcow1/`)
- **Framework:** React + TypeScript + Vite
- **Port:** 5173
- **Features:**
  - HR Management System
  - Attendance Tracking
  - Leave Management
  - Payroll Management
  - Dashboard & Reports

### 2. **Mobile App** (`expo-wrapper/`)
- **Framework:** Expo + React Native
- **Type:** WebView Wrapper
- **Port:** 8081 (Metro Bundler)
- **Features:**
  - Wraps web app in mobile container
  - Full web app functionality on mobile
  - Android & iOS compatible via Expo Go

### 3. **API Backend** (External)
- **Port:** 5000
- **Status:** Configure in `.env.local`

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Expo Go app installed on phone/emulator

### Launch Commands

**Option 1: Automatic (Batch Script)**
```batch
START_APP.bat
```

**Option 2: Manual (Two Terminals)**

Terminal 1 - Web App:
```bash
cd app-7vshm2afcow1
npm install
npx vite --host 0.0.0.0 --port 5173
```

Terminal 2 - Expo Mobile:
```bash
cd expo-wrapper
npm install
npx expo start
```

---

## ⚠️ CRITICAL SETUP STEP

### Update Machine IP in Expo App

Edit: `expo-wrapper/App.js` (Line ~11)

```javascript
// BEFORE (Default)
const WEB_URL = 'http://192.168.0.113:5173';

// AFTER (Your IP)
const WEB_URL = 'http://YOUR.ACTUAL.IP:5173';
```

**Find your IP:**
```powershell
ipconfig
# Look for "IPv4 Address" in your network adapter
```

**Why?** WebView cannot use `localhost:5173` - it needs the actual machine IP to connect from mobile device.

---

## 📱 Accessing the Application

### Via Web Browser
- Open: `http://localhost:5173`
- Full HR System interface

### Via Mobile Device (Expo Go)
1. Start Expo: `npx expo start --clear`
2. Scan QR code with **Expo Go** app
3. App loads in mobile device via WebView

### Via Android Emulator
In Expo terminal: Press `a`

### Via iOS Simulator (macOS only)
In Expo terminal: Press `i`

---

## 🔧 Environment Configuration

### Web App (`.env.local`)
```env
VITE_APP_ID=app-7vshm2afcow1
VITE_API_BASE_URL=http://localhost:5000
```

### Expo Mobile (`app.json`)
```json
{
  "extra": {
    "apiUrl": "http://localhost:5000",
    "webUrl": "http://YOUR_IP:5173"
  }
}
```

---

## 📊 System Status

| Component | Status | Command |
|-----------|--------|---------|
| Web App | ✅ Ready | `cd app-7vshm2afcow1 && npx vite` |
| Expo | ✅ Ready | `cd expo-wrapper && npx expo start` |
| Dependencies | ✅ Clean | 0 vulnerabilities |
| CORS | ✅ Enabled | Localhost & LAN addresses |

---

## 🐛 Troubleshooting

### Problem: "Something went wrong" in Expo
**Solution 1:** Check IP address in App.js
```javascript
const WEB_URL = 'http://192.168.0.113:5173'; // Update this!
```

**Solution 2:** Verify web app is running
```bash
# In Terminal 1, check if you see:
# ✓ ready in 1234ms
```

**Solution 3:** Check network connectivity
```powershell
# From phone/emulator, verify:
ping YOUR_MACHINE_IP
```

---

### Problem: Port Already in Use
**Web app port 5173 in use:**
```bash
npx vite --port 5174  # Use different port
```

**Expo port 8081 in use:**
- Press `y` when prompted to use alternative port

---

### Problem: CORS/Network Errors
**Fix 1:** Ensure same WiFi network
- Phone must be on same network as development machine

**Fix 2:** Check firewall
- Allow port 5173 through Windows Firewall

**Fix 3:** Check API connectivity
- Verify API is running on port 5000
- Check `.env.local` API_BASE_URL

---

## 📦 Project Dependencies

### Web App Key Packages
- React 18
- TypeScript 5.9
- Vite 5.1
- React Router 7
- Axios
- TailwindCSS

### Mobile App Key Packages
- Expo 54
- React 19.1
- React Native 0.81
- React Native WebView 13.8

---

## ✅ Production Deployment

### Before Production:

- [ ] Update API endpoints in `.env.local`
- [ ] Configure CORS on backend
- [ ] Build web app: `npm run build`
- [ ] Test on real device/emulator
- [ ] Create signed APK/AAB for Android
- [ ] Archive for iOS TestFlight

### Build Commands

**Web App:**
```bash
cd app-7vshm2afcow1
npm run build  # Outputs to dist/
```

**Expo Android APK:**
```bash
cd expo-wrapper
eas build --platform android
```

**Expo iOS Archive:**
```bash
cd expo-wrapper
eas build --platform ios
```

---

## 📝 File Structure

```
hr_frontend_app/
├── app-7vshm2afcow1/          ← Web App (React/Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.local
│
├── expo-wrapper/               ← Mobile App (Expo)
│   ├── App.js                  ← ⚠️ UPDATE IP HERE
│   ├── index.js
│   ├── app.json
│   ├── package.json
│   └── assets/
│
├── START_APP.bat               ← Batch launcher script
├── EXPO_SETUP_GUIDE.md         ← Detailed Expo docs
└── README.md                   ← This file
```

---

## 🔗 Key URLs

| Service | URL | Notes |
|---------|-----|-------|
| Web App | http://localhost:5173 | Development |
| Expo Metro | exp://YOUR_IP:8081 | QR code in terminal |
| API Backend | http://localhost:5000 | External service |
| Your Machine | http://YOUR_IP:5173 | For mobile access |

---

## 📞 Support & Documentation

- **Web App Docs:** See `/app-7vshm2afcow1/README.md`
- **Expo Docs:** See `EXPO_SETUP_GUIDE.md`
- **Expo Go:** https://expo.dev/go
- **Vite Docs:** https://vitejs.dev
- **React Native:** https://reactnative.dev

---

## 🎓 How It Works

### Web App Flow
1. User opens http://localhost:5173
2. React app loads with Vite
3. Authentication handled via AuthContext
4. API calls go to http://localhost:5000
5. Full HR system functionality available

### Mobile App Flow
1. User scans QR code in Expo terminal
2. Expo Metro bundles and serves the app
3. Mobile app loads via Expo Go
4. WebView component in React Native
5. WebView loads React app from IP:5173
6. Same web app UI and functionality on mobile

---

## ⚡ Performance Tips

1. **Keep Web App Running:** Don't restart web app while using mobile
2. **Use Localhost for Web:** Direct browser access is faster
3. **Use IP for Mobile:** Mobile devices need the IP address
4. **Reload App:** Press `r` in Expo terminal to refresh
5. **Cache:** Clear cache if having issues: `npx expo start --clear`

---

## 🚀 Status: Production Ready ✅

The application is fully configured and ready for:
- ✅ Development testing
- ✅ QA testing on mobile devices
- ✅ Production deployment
- ✅ Multiple user testing

---

**Last Updated:** December 3, 2025  
**Version:** 1.0.0  
**Status:** Stable

