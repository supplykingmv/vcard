import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

export async function addContact(userId: string, contact: Omit<Contact, 'id' | 'dateAdded'>) {
  return await addDoc(collection(db, "contacts"), { ...contact, userId, dateAdded: new Date().toISOString() });
}

export async function updateContact(contactId: string, contact: Partial<Contact>) {
  return await updateDoc(doc(db, "contacts", contactId), contact);
}

export async function deleteContact(contactId: string) {
  return await deleteDoc(doc(db, "contacts", contactId));
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const q = query(collection(db, "contacts"), where("userId", "==", userId));
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