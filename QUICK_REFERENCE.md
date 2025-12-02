# 🎯 Quick Start - Both Apps Running!

## ✅ Current Status

| App | Status | URL/QR | Port |
|-----|--------|--------|------|
| **Vite Web** | ✅ Running | http://192.168.0.121:5173 | 5173 |
| **Expo Wrapper** | ✅ Running | exp://127.0.0.1:8082 | 8082 |

---

## 📱 Access Your App on Phone

### Method 1: Expo Go (Recommended)
1. Install **Expo Go** app on phone
2. **Scan QR code** shown in terminal
3. App opens in Expo Go with WebView
4. Login with demo credentials

### Method 2: Direct Browser
1. Open phone browser
2. Go to: **http://192.168.0.121:5173/**
3. Login and use the app

---

## 🔐 Demo Login Credentials

```
Admin:     admin@company.com / password123
HR:        hr@company.com / password123
Employee:  employee@company.com / password123
Marketing: marketing@company.com / password123
```

---

## ⚡ Commands (If You Need to Restart)

### Web Server (Terminal 1)
```bash
cd C:\Users\ADMIN\Downloads\app-7vshm2afcow1_app_version-7vsssklejaww\app-7vshm2afcow1
npx vite --host 0.0.0.0 --port 5173
```

### Expo Wrapper (Terminal 2)
```bash
cd C:\Users\ADMIN\Downloads\app-7vshm2afcow1_app_version-7vsssklejaww\expo-wrapper
npm start
```

---

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| Web App | http://192.168.0.121:5173/ |
| Localhost | http://localhost:5173/ |
| Expo QR | exp://127.0.0.1:8082 |

---

## 🎨 Features Available

✅ Dashboard with attendance summary
✅ Check In / Check Out  
✅ Leave requests & approvals
✅ Team management
✅ User profiles
✅ Holiday calendar
✅ Payroll info
✅ Documents storage
✅ Notes & collaboration
✅ Settings & preferences

---

## 🆘 Troubleshooting

### "Something went wrong" error
- Ensure Vite server is running on 5173
- Check network: phone & PC must be on same Wi-Fi
- Restart both servers
- Clear Expo Go cache and retry

### Can't find server
- Get your PC IP: Run `ipconfig` in cmd
- Replace 192.168.0.121 with your actual IP
- Update App.js URI if IP changed

### Port 8082 in use?
```bash
npx expo start --localhost --port 8083
```

---

## 📂 Files Generated

- `/vite-qr.png` - QR for web browser access
- `/expo-qr.png` - QR for Expo Go access
- `/SETUP_AND_USAGE.md` - Full documentation

---

**Everything is set up and working! 🚀**

Scan the QR code from the Expo terminal with your phone's Expo Go app now!
