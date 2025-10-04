import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  // TEMPORARY: StrictMode disabled to fix planned transactions infinite loop
  // TODO: Re-enable after fixing hook dependencies
  // <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  // </React.StrictMode>
)
