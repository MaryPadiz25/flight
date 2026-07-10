// ============================================================
// FIREBASE INIT
//
// This app ships in DEMO_MODE (no live Firebase project needed) so it
// can be opened directly and previewed. To go live:
//
//   1. Create a Firebase project → enable Authentication (Email/Password)
//      and Cloud Firestore.
//   2. Paste your web app config into firebaseConfig below.
//   3. Set DEMO_MODE = false.
//   4. Deploy docs/firestore.rules with `firebase deploy --only firestore:rules`.
//
// Uncomment the SDK imports once a real project is connected — they're
// left commented so this file has zero network dependency in demo mode.
// ============================================================

export const DEMO_MODE = true;

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// --- Live Firebase wiring (uncomment when DEMO_MODE = false) ---
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// export const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

// --- Demo-mode session helper (sessionStorage stands in for Firebase Auth state) ---
const KEY = 'skyline_demo_session';

export function demoSignIn(role){
  const profiles = {
    student:    { uid:'st1', role:'student',    name:'Maya Reyes' },
    instructor: { uid:'in1', role:'instructor', name:'Daniel Ortiz' },
    admin:      { uid:'ad1', role:'admin',      name:'Priya Shah' },
  };
  sessionStorage.setItem(KEY, JSON.stringify(profiles[role]));
  return profiles[role];
}

export function getSession(){
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function demoSignOut(){
  sessionStorage.removeItem(KEY);
}

export function requireRole(role){
  const s = getSession();
  if (!s || s.role !== role){
    window.location.href = '/login.html';
    return null;
  }
  return s;
}
