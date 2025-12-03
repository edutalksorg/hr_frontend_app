# Expo Mobile App - Setup & Configuration Guide

## 🎯 Project Overview
The `expo-wrapper` is a simple React Native application that wraps the HR System web app (running on port 5173) in a WebView for mobile deployment.

## ⚠️ CRITICAL CONFIGURATION

### Machine IP Address
The app loads the web app from: `http://192.168.0.113:5173`

**You MUST update this IP address to match your machine's IP address!**

#### How to find your machine IP:

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" in your network adapter (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig
```

#### Update in App.js:
File: `expo-wrapper/App.js`
```javascript
const WEB_URL = 'http://YOUR_MACHINE_IP:5173'; // Change this line
```

---

## 🚀 Starting the Application

### Step 1: Start the Web App
```bash
cd app-7vshm2afcow1
npx vite --host 0.0.0.0 --port 5173
```
✅ Web app will be running on: `http://localhost:5173`

### Step 2: Start the Expo Mobile App
```bash
cd expo-wrapper
npx expo start --clear
```

### Step 3: Scan QR Code with Expo Go
- Download **Expo Go** app from Google Play Store or Apple App Store
- Scan the QR code displayed in the terminal
- The mobile app will load the web app in a WebView

---

## 📱 Alternative Launch Methods

### Open in Web Browser
In Expo terminal, press `w`

### Open in Android Emulator
In Expo terminal, press `a`
(Requires Android SDK/Emulator installed)

### Open in iOS Simulator
In Expo terminal, press `i`
(macOS only)

---

## 🔧 Troubleshooting

### "Something went wrong" Error

**Cause 1: IP Address Mismatch**
- The IP in App.js doesn't match your machine's IP
- **Fix:** Update `WEB_URL` in App.js with your machine's IP

**Cause 2: Web App Not Running**
- The web app on port 5173 is not running
- **Fix:** Start the web app first (Step 1 above)

**Cause 3: Network Connectivity**
- Device/emulator cannot reach the machine IP
- **Fix:** Ensure device is on the same WiFi network

**Cause 4: Firewall Blocking**
- Windows Firewall or antivirus blocking port 5173
- **Fix:** Add exceptions or disable firewall temporarily

### Metro Bundler Port Conflict
If you see "Port 8081 is being used by another process":
- Type `yes` to use the suggested alternative port
- Or kill the process using port 8081

---

## 📦 Project Structure

```
expo-wrapper/
├── App.js                 ← Main app component (WebView wrapper)
├── index.js              ← Entry point
├── app.json              ← Expo configuration
├── package.json          ← Dependencies
└── assets/               ← Icon and splash images
```

---

## 🔗 Running URLs

| Component | URL | Port |
|-----------|-----|------|
| Web App | http://localhost:5173 | 5173 |
| Expo Metro | exp://192.168.0.113:8081 | 8081 |
| API Backend | http://localhost:5000 | 5000 |

---

## ✅ Production Checklist

- [ ] Update IP address in App.js for your environment
- [ ] Web app running on port 5173
- [ ] Expo app built and tested on device/emulator
- [ ] Network connectivity verified between device and machine
- [ ] Firewall rules configured to allow port 5173
- [ ] Load testing completed

---

## 📝 Notes

- The app uses WebView to display the web app - no separate mobile UI
- All web app functionality works as-is on mobile
- Network errors are displayed with helpful messages
- Loading indicator shown during page transitions

---

## 🆘 Support

If issues persist:
1. Check your machine IP matches in App.js
2. Verify web app is running on port 5173
3. Check network connectivity
4. Review console logs for detailed errors
5. Try clearing Metro Bundler cache: `npx expo start --clear`

