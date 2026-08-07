import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TalaSettings, ChatMessage, KnowledgeFile, TelemetryLogEntry } from '../types';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Auth helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore operations for TALA OS

// Settings / User Profile
export async function saveUserSettings(userId: string, settings: Partial<TalaSettings>) {
  const path = `users/${userId}`;
  try {
    // Exclude API keys from cloud save for security
    const safeSettings = { ...settings };
    delete safeSettings.openrouterApiKey;
    delete safeSettings.googleApiKey;
    delete safeSettings.customApiKey;

    await setDoc(doc(db, path), {
      userId,
      ...safeSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserSettings(userId: string): Promise<Partial<TalaSettings> | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as Partial<TalaSettings>;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Chat Messages
export async function saveChatMessage(userId: string, message: ChatMessage) {
  const path = `users/${userId}/messages/${message.id}`;
  try {
    await setDoc(doc(db, path), {
      ...message,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function listenChatMessages(userId: string, callback: (messages: ChatMessage[]) => void) {
  const path = `users/${userId}/messages`;
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: data.id || docSnap.id,
          role: data.role,
          text: data.text,
          timestamp: data.timestamp
        });
      });
      callback(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

// Knowledge Documents
export async function saveKnowledgeDoc(userId: string, docData: KnowledgeFile) {
  const path = `users/${userId}/knowledge/${docData.id}`;
  try {
    await setDoc(doc(db, path), {
      ...docData,
      userId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteKnowledgeDoc(userId: string, docId: string) {
  const path = `users/${userId}/knowledge/${docId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function listenKnowledgeDocs(userId: string, callback: (docs: KnowledgeFile[]) => void) {
  const path = `users/${userId}/knowledge`;
  try {
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const files: KnowledgeFile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        files.push({
          id: data.id || docSnap.id,
          name: data.name,
          size: data.size,
          content: data.content,
          type: data.type,
          uploadedAt: data.uploadedAt
        });
      });
      callback(files);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

// Telemetry Logs
export async function saveTelemetryLog(userId: string, log: TelemetryLogEntry) {
  const path = `users/${userId}/telemetry/${log.id}`;
  try {
    await setDoc(doc(db, path), {
      ...log,
      userId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
