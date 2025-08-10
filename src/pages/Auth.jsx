import React, { useState } from 'react'
import { Card, CardContent, Label, Input, Button } from '../components/ui.jsx'
import { LogIn } from 'lucide-react'

export default function AuthScreens({ onLogin }){
  const [mode,setMode]=useState('login')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const canSubmit = mode==='register' ? (name && email && password) : (email && password)
  return (
    <div className="min-h-[70vh] grid place-items-center">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">{mode==='login'?'Accedi':'Crea un account'}</h2>
          {mode==='register' && (<div><Label>Nome</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Michele"/></div>)}
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@email.com"/></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"/></div>
          <Button className="w-full rounded-xl" onClick={()=> canSubmit && onLogin({ name: name || email.split('@')[0], email })} disabled={!canSubmit}>
            <LogIn className="mr-2 h-4 w-4"/>{mode==='login'?'Entra':'Registrati'}
          </Button>
          <div className="text-center text-sm">
            {mode==='login' ? (
              <button className="underline" onClick={()=>setMode('register')}>Non hai un account? Registrati</button>
            ) : (
              <button className="underline" onClick={()=>setMode('login')}>Hai già un account? Accedi</button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
