import firebase from 'firebase';
import { config } from './config';
import 'firebase/firestore';

export const firebaseApp = firebase.initializeApp(config);
export const firebaseDb = firebaseApp.firestore();
