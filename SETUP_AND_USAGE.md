# HR Attendance System - Mobile & Web Setup Guide

## ✅ Current Status

Both applications are running and fully functional:

- **Web App (Vite)**: http://192.168.0.121:5173/
- **Expo Wrapper**: exp://127.0.0.1:8082
- **Vite Server Terminal**: Running on port 5173
- **Expo Server Terminal**: Running on port 8082

## 📱 How to Access on Your Phone

### Option 1: View App in Expo Go (Recommended for Development)

1. **Open Expo Go** on your phone:
   - Android: Install "Expo Go" from Google Play Store
   - iOS: Install "Expo Go" from App Store

2. **Scan the QR code** shown in the terminal (or in `expo-qr.png`)

3. **Wait for the app to load** inside Expo Go

4. Your Vite web app will display inside a WebView component

### Option 2: Direct Browser Access

1. **Open any browser** on your phone
2. **Go to**: `http://192.168.0.121:5173/`
3. **Enjoy your web app!**

## 🚀 To Start Both Servers

### Terminal 1 - Start Vite Web Server

```bash
cd C:\Users\ADMIN\Downloads\app-7vshm2afcow1_app_version-7vsssklejaww\app-7vshm2afcow1
npx vite --host 0.0.0.0 --port 5173
```

### Terminal 2 - Start Expo Wrapper

```bash
cd C:\Users\ADMIN\Downloads\app-7vshm2afcow1_app_version-7vsssklejaww\expo-wrapper
npm start
```

Or manually:
```bash
npx expo start --localhost --port 8082
```

## 📂 Project Structure

```
app-7vshm2afcow1_app_version-7vsssklejaww/
│
├── app-7vshm2afcow1/              (Original Vite React App)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── vite-qr.png                (QR code for direct web access)
│
├── expo-wrapper/                  (Expo Mobile Wrapper)
│   ├── App.js                     (WebView component)
│   ├── index.js                   (Entry point)
│   ├── app.json                   (Expo configuration)
│   ├── package.json               (Dependencies)
│   ├── expo-qr.png                (QR code for Expo Go)
│   └── node_modules/
```

## 🔧 Key Files

### `/app-7vshm2afcow1/` - Web App
- **Main app**: React + Vite + TypeScript
- **Features**: Dashboard, Attendance, Leave, Teams, etc.
- **Access**: http://192.168.0.121:5173/

### `/expo-wrapper/App.js` - Mobile Wrapper
```javascript
import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'http://192.168.0.121:5173' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalePageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
```

## ✨ Features (Both Working)

### Web App (Vite)
- ✅ Full HR system functionality
- ✅ Attendance tracking (Check In / Check Out)
- ✅ Leave requests
- ✅ Team management
- ✅ User profiles
- ✅ Dashboard with analytics
- ✅ Responsive design

### Expo Wrapper
- ✅ Loads web app in WebView
- ✅ QR code scanning with Expo Go
- ✅ Full JavaScript support
- ✅ Local storage support
- ✅ Cross-platform (Android/iOS)

## 🔄 Development Workflow

1. **Edit code** in `/app-7vshm2afcow1/src/`
2. **Vite** automatically hot-reloads changes
3. **Open on phone** - changes appear in real-time
4. Both web and mobile views update simultaneously

## ⚙️ Troubleshooting

### Port Already in Use
If port 8082 is in use:
```bash
npx expo start --localhost --port 8083
```

### "Something went wrong" in Expo Go
- Ensure both machines are on same Wi-Fi network
- Verify Vite server is running: http://192.168.0.121:5173/
- Check firewall isn't blocking connections
- Restart both servers

### Can't connect to web server from phone
- Replace `192.168.0.121` with your actual PC IP
- Get your IP: `ipconfig` in cmd/PowerShell
- Ensure phone and PC are on same network

## 📋 Demo Credentials

```
Admin:     admin@company.com     / password123
HR:        hr@company.com        / password123
Employee:  employee@company.com  / password123
Marketing: marketing@company.com / password123
```

## 🎯 Next Steps

1. ✅ Both servers are running
2. ✅ Open Expo Go on your phone
3. ✅ Scan the QR code from terminal
4. ✅ Login with demo credentials
5. ✅ Explore the app features

---

**Both Web App and Expo Wrapper are fully functional and ready to use!** 🚀
