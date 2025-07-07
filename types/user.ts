export interface User {
  id: string
  email: string
  password: string
  role: "admin" | "user"
  name: string
  dateAdded: Date
  isActive: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}
