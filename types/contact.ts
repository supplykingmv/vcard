export interface Contact {
  id: string
  name: string
  title: string
  company: string
  email: string
  phone: string
  category: "Work" | "Business" | "Personal" | "My Card"
  avatar?: string
  dateAdded: Date
  notes?: string
  website?: string
  address?: string
  pinned?: boolean
}
