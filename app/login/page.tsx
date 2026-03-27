'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [session, setSession] = useState('')
  const [requiresNewPassword, setRequiresNewPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://cognito-idp.sa-east-1.amazonaws.com/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target':
              'AWSCognitoIdentityProviderService.InitiateAuth',
          },
          body: JSON.stringify({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
            },
          }),
        }
      )
      const data = await res.json()

      if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        setSession(data.Session)
        setRequiresNewPassword(true)
        return
      }

      if (data.AuthenticationResult?.IdToken) {
        localStorage.setItem(
          'hobbyer_admin_token',
          data.AuthenticationResult.IdToken
        )
        router.push('/dashboard')
      } else {
        setError('Email o contraseña incorrectos.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        'https://cognito-idp.sa-east-1.amazonaws.com/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target':
              'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
          },
          body: JSON.stringify({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
            Session: session,
            ChallengeResponses: {
              USERNAME: email,
              NEW_PASSWORD: newPassword,
            },
          }),
        }
      )
      const data = await res.json()
      if (data.AuthenticationResult?.IdToken) {
        localStorage.setItem(
          'hobbyer_admin_token',
          data.AuthenticationResult.IdToken
        )
        router.push('/dashboard')
      } else {
        setError('Error al cambiar la contraseña.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#101622] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            hobbyer
            <span className="text-[#0d59f2]">.</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Panel de administración
          </p>
        </div>

        {/* Form */}
        {requiresNewPassword ? (
          <div className="bg-[#1b212d] rounded-2xl p-8 space-y-5">
            <div className="text-center mb-2">
              <p className="text-white font-bold">Nueva contraseña requerida</p>
              <p className="text-slate-400 text-sm mt-1">
                Es tu primer ingreso. Elegí una contraseña nueva.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNewPassword()}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-[#252b3b] border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-[#0d59f2] outline-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleNewPassword}
              disabled={loading}
              className={`w-full bg-[#0d59f2] text-white font-bold py-3 rounded-xl transition-all
                ${loading
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-[#0a3db5] active:scale-95'
                }`}
            >
              {loading ? 'Guardando...' : 'Confirmar contraseña'}
            </button>
          </div>
        ) : (
          <div className="bg-[#1b212d] rounded-2xl p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hobbyer.club"
                className="w-full bg-[#252b3b] border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-[#0d59f2] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-[#252b3b] border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-[#0d59f2] outline-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full bg-[#0d59f2] text-white font-bold py-3 rounded-xl transition-all
                ${loading
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-[#0a3db5] active:scale-95'
                }`}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
