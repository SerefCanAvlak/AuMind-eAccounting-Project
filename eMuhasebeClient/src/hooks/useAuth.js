import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

// Auth Custom hook
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
      throw new Error("useAuth hook'u AuthProvider içinde kullanılmalıdır")
    }
    return context
  }
  
  