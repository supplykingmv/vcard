export interface User {
  id: string
  email: string
  password: string
  role: "superadmin" | "admin" | "editor" | "viewer"
  name: string
  dateAdded: Date
  isActive: boolean
  clearedNotifications?: string[]
  phone?: string
  website?: string
  address?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}
