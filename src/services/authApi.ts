const AUTH_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth`

export interface AuthUser {
    id: string
    email: string
}

export interface AuthSession {
    user: AuthUser
    accessToken: string
    tokenType: string
    expiresAt: string
}

export type AuthErrorCode =
    | 'authConnectionError'
    | 'authRequestError'
    | 'authInvalidCredentials'
    | 'authAccountExists'
    | 'authRateLimited'
    | 'authUnknownError'

export class AuthApiError extends Error {
    constructor(public readonly code: AuthErrorCode) {
        super(code)
        this.name = 'AuthApiError'
    }
}

function isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as Record<string, unknown>
    if (typeof candidate.user !== 'object' || candidate.user === null) return false
    const user = candidate.user as Record<string, unknown>
    return (
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof candidate.accessToken === 'string' &&
        typeof candidate.tokenType === 'string' &&
        typeof candidate.expiresAt === 'string' &&
        Number.isFinite(Date.parse(candidate.expiresAt))
    )
}

export async function authenticate(
    action: 'login' | 'register',
    email: string,
    password: string,
): Promise<AuthSession> {
    let response: Response
    try {
        response = await fetch(`${AUTH_ENDPOINT}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
    } catch {
        throw new AuthApiError('authConnectionError')
    }

    if (!response.ok) {
        if (response.status === 401) throw new AuthApiError('authInvalidCredentials')
        if (response.status === 409) throw new AuthApiError('authAccountExists')
        if (response.status === 429) throw new AuthApiError('authRateLimited')
        if (response.status === 400) throw new AuthApiError('authRequestError')
        throw new AuthApiError('authUnknownError')
    }

    try {
        const payload: unknown = await response.json()
        if (!isAuthSession(payload)) throw new Error('Invalid authentication response')
        return payload
    } catch {
        throw new AuthApiError('authUnknownError')
    }
}
