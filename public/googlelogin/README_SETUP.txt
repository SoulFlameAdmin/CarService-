SoulFlame — Google Login + Profile (Firebase)

ПЪТ (както е в твоя проект):
E:\SOULFLAME_v1\public\login\
  - registraciq.html
  - registraciq.css
  - registraciq.js
  - googlelogin\
      firebase.js
      auth.js
      firestore.rules.txt
  - profil\
      profil.html
      profil.css
      profil.js

1) Firebase Console:
   - Authentication -> Sign-in method -> Enable Google
   - Authentication -> Settings -> Authorized domains:
       add: localhost
       add: 127.0.0.1
       add: твоят домейн (ако качиш онлайн)
   - Firestore Database -> Create database (test mode или production)
   - Project settings -> Your apps -> Web app:
       копирай config-а и го постави във:
       login/googlelogin/firebase.js

2) Стартирай локално (важно: НЕ отваряй file:///):
   В папката E:\SOULFLAME_v1\public пусни:
     npx serve -l 5173
   После отвори:
     http://localhost:5173/login/registraciq.html

3) Как работи:
   - Клик на Google иконата в registraciq.html -> Google Sign-In
   - Записва/обновява Firestore документ: users/{uid}
   - Препраща към: /login/profil/profil.html
   - profile page е защитена: ако не си логнат -> връща към registraciq.html

Ако удари грешка "unauthorized-domain" -> Authorized domains (точка 1).
