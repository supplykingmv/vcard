import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { Contact } from "@/types/contact";

const firebaseConfig = {
  apiKey: "AIzaSyAqpfMTmMNL-R28m-V4Wl4ple--wjx79dE",
  authDomain: "contactmanager-989ba.firebaseapp.com",
  projectId: "contactmanager-989ba",
  storageBucket: "contactmanager-989ba.appspot.com",
  messagingSenderId: "225237882140",
  appId: "1:225237882140:web:b243e3a06d8d5f4c4496d9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Auth with local persistence for better iOS standalone app support
// This ensures the user stays logged in across app restarts
const initializeAuth = async () => {
  try {
    // Check if we're in a standalone app (iOS PWA)
    const isStandalone = (window.navigator as any).standalone || 
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    if (isStandalone) {
      // For standalone apps, use local persistence to maintain login state
      await setPersistence(auth, browserLocalPersistence);
    } else {
      // For regular browser, also use local persistence for "remember me" functionality
      await setPersistence(auth, browserLocalPersistence);
    }
  } catch (error) {
    console.warn('Failed to set auth persistence:', error);
    // Fallback to in-memory persistence if local storage is not available
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (fallbackError) {
      console.error('Failed to set fallback persistence:', fallbackError);
    }
  }
};

// Initialize auth persistence when the module loads
if (typeof window !== 'undefined') {
  initializeAuth();
}

export async function addContact(userId: string, contact: Omit<Contact, 'id' | 'dateAdded'>) {
  return await addDoc(collection(db, "contacts"), { ...contact, userId, dateAdded: new Date().toISOString() });
}

export async function updateContact(contactId: string, contact: Partial<Contact>) {
  // Ensure dateAdded is serialized if present and valid
  const contactToUpdate: any = { ...contact };
  if (
    contactToUpdate.dateAdded instanceof Date &&
    !isNaN(contactToUpdate.dateAdded.getTime())
  ) {
    contactToUpdate.dateAdded = contactToUpdate.dateAdded.toISOString();
  } else if (
    typeof contactToUpdate.dateAdded === "string" &&
    !isNaN(Date.parse(contactToUpdate.dateAdded))
  ) {
    // Already a valid ISO string, do nothing
  } else {
    // Remove or ignore invalid date
    delete contactToUpdate.dateAdded;
  }
  return await updateDoc(doc(db, "contacts", contactId), contactToUpdate);
}

export async function deleteContact(contactId: string) {
  return await deleteDoc(doc(db, "contacts", contactId));
}

export async function getContacts(user: { id: string, role: string }): Promise<Contact[]> {
  if (["admin", "editor", "viewer", "superadmin"].includes(user.role)) {
    // Fetch all contacts
    const snap = await getDocs(collection(db, "contacts"));
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dateAdded: data.dateAdded ? new Date(data.dateAdded) : new Date(),
      } as Contact;
    });
  } else {
    // Fetch only own contacts
    const q = query(collection(db, "contacts"), where("userId", "==", user.id));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dateAdded: data.dateAdded ? new Date(data.dateAdded) : new Date(),
      } as Contact;
    });
  }
}

export async function setUserOnline(userId: string) {
  await setDoc(doc(db, "presence", userId), { online: true, lastActive: serverTimestamp() }, { merge: true });
}

export async function setUserOffline(userId: string) {
  await setDoc(doc(db, "presence", userId), { online: false, lastActive: serverTimestamp() }, { merge: true });
}

export function subscribeToOnlineUsers(callback: (users: { userId: string, lastActive: any }[]) => void) {
  return onSnapshot(query(collection(db, "presence"), where("online", "==", true)), (snap) => {
    callback(snap.docs.map(docSnap => ({ userId: docSnap.id, lastActive: docSnap.data().lastActive })))
  })
}

// Notification helpers
export async function addNotification(notification: { message: string, senderId: string, senderName: string, type?: string, excludeUserIds?: string[] }) {
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: new Date().toISOString(),
  })
  return docRef.id
}

export async function getNotifications(limitCount = 20) {
  const snap = await getDocs(collection(db, "notifications"))
  return snap.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => {
      const aDate = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bDate = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, limitCount)
}

export function subscribeToNotifications(callback: (notifications: any[]) => void) {
  return onSnapshot(collection(db, "notifications"), (snap) => {
    const notifs = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    callback(notifs.sort((a, b) => {
      const aDate = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bDate = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return bDate - aDate;
    }))
  })
} 