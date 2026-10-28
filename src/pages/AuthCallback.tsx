import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { getCurrentSession } from '../lib/auth'
import { homePath } from '../lib/utils'

function safeReturnPath(path: string | null): string | undefined {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return undefined
  if (path.startsWith('/auth/callback')) return undefined
  return path
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const next = safeReturnPath(searchParams.get('next'))
  const providerError = searchParams.get('error_description') || searchParams.get('error')

  useEffect(() => {
    let active = true

    if (providerError) {
      setError(providerError)
      return () => { active = false }
    }

    getCurrentSession()
      .then((session) => {
        if (!active) return
        if (!session) {
          setError('Google sign-in could not be completed. Please try again.')
          return
        }
        navigate(next ?? homePath(session.user.role), { replace: true })
      })
      .catch(() => {
        if (active) setError('Google sign-in could not be completed. Please try again.')
      })

    return () => { active = false }
  }, [navigate, next, providerError])

  return (
    <AuthShell
      title={error ? 'Sign-in couldn’t be completed' : 'Signing you in'}
      subtitle={error || 'Your Google account is connected. We’re opening your Anatomia account.'}
      footer={error ? <>Return to <Link to="/login" className="font-medium text-brand-700 hover:underline">sign in</Link></> : <span>Secure sign-in with Google</span>}
    >
      {error ? (
        <Link to="/login" className="btn-primary w-full">Back to sign in</Link>
      ) : (
        <div className="flex justify-center py-5" role="status" aria-label="Signing in">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
        </div>
      )}
    </AuthShell>
  )
}
