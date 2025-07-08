"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, AuthState } from "@/types/user"
import { auth, db } from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore"

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  addUser: (userData: Omit<User, "id" | "dateAdded">) => Promise<boolean>
  getUsers: () => Promise<User[]>
  updateUser: (userId: string, userData: Partial<User>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default super admin user
const defaultSuperAdmin: User = {
  id: "superadmin-1",
  email: "rixaski@gmail.com",
  password: "welcome123",
  role: "superadmin",
  name: "Super Admin User",
  dateAdded: new Date(),
  isActive: true,
}

// Default admin user
const defaultAdmin: User = {
  id: "admin-1",
  email: "rixaski@gmail.com",
  password: "welcome123",
  role: "admin",
  name: "Admin User",
  dateAdded: new Date(),
  isActive: true,
}

// Helper function to convert user data from storage (handles Date conversion)
const parseUserFromStorage = (userData: any): User => {
  return {
    ...userData,
    dateAdded: new Date(userData.dateAdded),
  }
}

// Helper function to parse users array from storage
const parseUsersFromStorage = (usersData: any[]): User[] => {
  return usersData.map(parseUserFromStorage)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })

  // Helper to map Firestore user doc to User type
  const mapFirestoreUser = (uid: string, data: any): User => ({
    id: uid,
    email: data.email,
    password: "",
    role: data.email === "rixaski@gmail.com" ? "admin" : (data.role as User["role"] ?? "viewer"),
    name: data.name || data.email,
    dateAdded: data.dateAdded ? new Date(data.dateAdded) : new Date(),
    isActive: data.isActive !== false,
    clearedNotifications: data.clearedNotifications || [],
    phone: data.phone || "",
    website: data.website || "",
    address: data.address || "",
    company: data.company || "",
    title: data.title || "",
  })

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user metadata from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        let user: User
        if (userDoc.exists()) {
          user = mapFirestoreUser(firebaseUser.uid, userDoc.data())
        } else {
          // If no Firestore doc, create one with default role
          user = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            password: "",
            role: (firebaseUser.email === "rixaski@gmail.com") ? "admin" : (userDoc?.data()?.role === "admin" ? "admin" : "viewer"),
            name: firebaseUser.displayName || firebaseUser.email || "User",
            dateAdded: new Date(firebaseUser.metadata.creationTime || Date.now()),
            isActive: true,
            clearedNotifications: [],
          }
          await setDoc(doc(db, "users", firebaseUser.uid), {
            email: user.email,
            role: user.role,
            name: user.name,
            dateAdded: user.dateAdded.toISOString(),
            isActive: true,
            clearedNotifications: [],
            phone: user.phone || "",
            website: user.website || "",
            address: user.address || "",
            company: user.company || "",
            title: user.title || "",
          })
        }
        setAuthState({ user, isAuthenticated: true })
      } else {
        setAuthState({ user: null, isAuthenticated: false })
      }
    })
    return () => unsubscribe()
  }, [])

  // Register new user (admin only)
  const addUser = async (userData: Omit<User, "id" | "dateAdded">): Promise<boolean> => {
    if (authState.user?.role !== "superadmin" && authState.user?.role !== "admin") return false
    try {
      const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      await updateProfile(cred.user, { displayName: userData.name })
      await setDoc(doc(db, "users", cred.user.uid), {
        email: userData.email,
        role: userData.role,
        name: userData.name,
        dateAdded: new Date().toISOString(),
        isActive: userData.isActive,
        clearedNotifications: [],
        phone: userData.phone || "",
        website: userData.website || "",
        address: userData.address || "",
        company: userData.company || "",
        title: userData.title || "",
      })
      return true
    } catch (e) {
      return false
    }
  }

  // Get all users (admin only)
  const getUsers = async (): Promise<User[]> => {
    if (authState.user?.role !== "superadmin" && authState.user?.role !== "admin") return []
    const snap = await getDocs(collection(db, "users"))
    return snap.docs.map(docSnap => mapFirestoreUser(docSnap.id, docSnap.data()))
  }

  // Update user (admin or self)
  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    if (
      authState.user?.role !== "superadmin" &&
      authState.user?.role !== "admin" &&
      authState.user?.id !== userId
    ) return false
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, userData)
      // If updating self, update local state
      if (authState.user?.id === userId) {
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          setAuthState(s => ({
            ...s,
            user: mapFirestoreUser(userId, userDoc.data()),
          }))
        }
      }
      return true
    } catch (e) {
      return false
    }
  }

  // Delete user (admin only, cannot delete self)
  const deleteUser = async (userId: string): Promise<boolean> => {
    if ((authState.user?.role !== "superadmin" && authState.user?.role !== "admin") || userId === authState.user.id) return false
    try {
      await deleteDoc(doc(db, "users", userId))
      // Optionally, also delete from Auth (requires admin privileges on backend)
      return true
    } catch (e) {
      return false
    }
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    signOut(auth)
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (e) {
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        addUser,
        getUsers,
        updateUser,
        deleteUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
