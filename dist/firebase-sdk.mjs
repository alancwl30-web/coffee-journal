// Public web configuration identifies the project; Firestore rules enforce access.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signOut,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,setDoc,serverTimestamp,getDocsFromServer} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const app=initializeApp({apiKey:'AIzaSyCVSejA1KOUMhoAyTayzMu6pnEAikU7A1A',authDomain:'coffee-journal-342ba.firebaseapp.com',projectId:'coffee-journal-342ba',storageBucket:'coffee-journal-342ba.firebasestorage.app',messagingSenderId:'115561429256',appId:'1:115561429256:web:c039c6c9840ff1e7e954bd'});
export const auth=getAuth(app), db=getFirestore(app);
export {GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signOut,setPersistence,browserLocalPersistence,collection,doc,onSnapshot,setDoc,serverTimestamp,getDocsFromServer};
