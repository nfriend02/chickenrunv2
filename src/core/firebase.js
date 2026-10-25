import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { i18n } from './i18n.js';

// Web config is public by design; access is controlled by Firebase security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyDqExDomYOlrSfSOwuAMqT-1QzPscTv1zM',
  authDomain: 'chickenrunv2.firebaseapp.com',
  projectId: 'chickenrunv2',
  storageBucket: 'chickenrunv2.firebasestorage.app',
  messagingSenderId: '731916518185',
  appId: '1:731916518185:web:3106e13df300f25f08ad38',
  measurementId: 'G-33CLTGW16Y'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Password-reset emails and Google sign-in follow the UI language.
auth.languageCode = i18n.lang;
i18n.subscribe((lang) => { auth.languageCode = lang; });
export const db = getFirestore(app);

let analytics = null;
// Analytics needs cookies/IndexedDB; skip it in unsupported or headless environments.
export const analyticsReady = isSupported()
  .then((ok) => {
    if (ok) analytics = getAnalytics(app);
    return analytics;
  })
  .catch(() => null);

export function trackEvent(name, params) {
  if (analytics) logEvent(analytics, name, params);
}
