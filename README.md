# 🚨 ResQon — Expo Go v54 Edition

Emergency Response App — React Native (Expo) + Node.js + MongoDB

---

## ⚡ Quick Start (3 terminals)

---

### Terminal 1 — Start MongoDB

```bash
# Make sure MongoDB is installed and running
mongod
```

---

### Terminal 2 — Start Backend

```bash
# Navigate into backend folder
cd ResQon/backend

# Install dependencies
npm install

# Seed the database (creates admin + test users)
npm run seed

# Start the backend server
npm run dev
```

You should see:
```
✅  MongoDB connected
🚀  Server running on port 5000
```

---

### Terminal 3 — Start Expo App

```bash
# Navigate to root ResQon folder
cd ResQon

# Install dependencies
npm install

# Start Expo
npx expo start
```

A QR code will appear in the terminal.
Open **Expo Go** on your Android phone and scan it.

---

## 🔧 One Required Config Before Running

Open this file:
```
ResQon/src/constants/index.js
```

Find this line:
```js
export const API_BASE = 'http://YOUR_PC_IP:5000/api';
```

Replace `YOUR_PC_IP` with your computer's actual IP address.

### How to find your IP:
- **Windows:** Open CMD → type `ipconfig` → look for "IPv4 Address"
- **Mac/Linux:** Open Terminal → type `ifconfig` → look for "inet"

Example:
```js
export const API_BASE = 'http://192.168.1.42:5000/api';
```

> ⚠️ Your phone and PC must be on the same WiFi network.

---

## 📱 Expo Go Setup on Phone

1. Install **Expo Go** from Play Store
2. Open Expo Go
3. Tap **Scan QR Code**
4. Scan the QR code shown in Terminal 3

---

## 🔐 Login Credentials (after seed)

| Role  | Email           | Password |
|-------|-----------------|----------|
| Admin | admin@sos.com   | admin123 |
| User  | rahul@test.com  | test123  |
| User  | priya@test.com  | test123  |

---

## 📦 What Changed for Expo Compatibility

| Original (RN CLI)               | Expo Go v54 Replacement     |
|---------------------------------|-----------------------------|
| react-native-geolocation-service| expo-location               |
| react-native-sound              | expo-av                     |
| react-native-sms                | expo-sms                    |
| react-native-image-picker       | expo-image-picker           |
| react-native-sensors            | expo-sensors                |
| react-native-permissions        | Built into Expo             |
| StatusBar (react-native)        | expo-status-bar             |

All features are fully preserved:
✅ SOS Button (3s hold)
✅ Crash Detection (accelerometer)
✅ Siren Audio
✅ SMS to emergency contacts
✅ Live GPS tracking
✅ Nearby volunteer alerts
✅ Evidence upload (photo/video)
✅ Multi-level verification
✅ Admin dashboard + routing
✅ Realtime polling (5s)

---

## 🗂 Folder Structure

```
ResQon/
├── index.js                  ← Expo entry point
├── app.json                  ← Expo config + permissions
├── babel.config.js           ← Babel with reanimated plugin
├── package.json              ← Expo-compatible dependencies
│
├── src/
│   ├── App.js
│   ├── constants/index.js    ← ⚠️ Set YOUR_PC_IP here
│   ├── store/
│   ├── services/             ← All rewritten for Expo
│   ├── hooks/
│   ├── components/
│   ├── screens/
│   └── navigation/
│
└── backend/
    ├── server.js
    ├── .env
    ├── models/
    ├── routes/
    ├── middleware/
    └── utils/seed.js
```

---

## 🔥 Troubleshooting

**"Network request failed"**
→ Check `API_BASE` IP in `src/constants/index.js`
→ Make sure backend is running (`npm run dev` in backend/)
→ Phone and PC must be on same WiFi

**"Location permission denied"**
→ Go to phone Settings → Apps → Expo Go → Permissions → Allow Location

**QR code not scanning**
→ Try pressing `w` in terminal to open web, or `a` for Android emulator

**Expo Go version mismatch**
→ Make sure Expo Go is updated to latest (v54) on Play Store

