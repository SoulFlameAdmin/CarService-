SoulFlame CarService – Firebase Setup

1) Влез в Firebase Console
2) Project Settings → General → добави Web App
3) Копирай config-а в:
   public/firebase-config.js

4) Firestore Database:
   - Create database (production)
   - Location: europe-west

5) Rules:
   - Firestore → Rules
   - Пейст firestore.rules

6) Indexes:
   - Firestore → Indexes
   - Import firestore.indexes.json

7) Authentication:
   - Enable Google provider
   - Authorized domains:
     - localhost
     - *.vercel.app

Готово.
