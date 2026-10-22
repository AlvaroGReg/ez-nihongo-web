const AUTH_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth`
const REQUEST_HEADER = 'X-EZ-Nihongo-Request'

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
    const expiresAt = typeof candidate.expiresAt === 'string' ? Date.parse(candidate.expiresAt) : NaN
    return (
        typeof user.id === 'string' &&
        user.id !== '' &&
        typeof user.email === 'string' &&
        user.email !== '' &&
        typeof candidate.accessToken === 'string' &&
        candidate.accessToken !== '' &&
        typeof candidate.tokenType === 'string' &&
        candidate.tokenType !== '' &&
        typeof candidate.expiresAt === 'string' &&
        Number.isFinite(expiresAt) &&
        expiresAt > Date.now()
    )
}

export async function authenticate(
    action: 'login' | 'register',
    email: string,
    password: string,
    rememberMe = false,
): Promise<AuthSession> {
    let response: Response
    try {
        response = await fetch(`${AUTH_ENDPOINT}/${action}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', [REQUEST_HEADER]: '1' },
            body: JSON.stringify({
                email,
                password,
                ...(action === 'login' ? { rememberMe } : {}),
            }),
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

export async function refreshAuthentication(): Promise<AuthSession | null> {
    let response: Response
    try {
        response = await fetch(`${AUTH_ENDPOINT}/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', [REQUEST_HEADER]: '1' },
            body: '{}',
        })
    } catch {
        return null
    }

    if (response.status === 401 || response.status === 404) return null
    if (!response.ok) return null

    try {
        const payload: unknown = await response.json()
        return isAuthSession(payload) ? payload : null
    } catch {
        return null
    }
}

export async function revokeAuthentication(): Promise<void> {
    try {
        await fetch(`${AUTH_ENDPOINT}/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', [REQUEST_HEADER]: '1' },
            body: '{}',
        })
    } catch {
        // Local sign-out must succeed even while the API is unavailable.
    }
}
