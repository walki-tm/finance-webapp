// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react"
import { api } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "")
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) localStorage.setItem("token", token)
    else localStorage.removeItem("token")
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user))
    else localStorage.removeItem("user")
  }, [user])

  async function login(email, password) {
    const r = await api.login(email, password) // { token, user }
    setToken(r.token)
    setUser(r.user)
  }

// ...
  async function register(name, email, password) {
    const r = await api.register(name, email, password) // { token, user }
    setToken(r.token)
    setUser(r.user)
  }


  function logout() {
    setToken("")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
