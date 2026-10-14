import { reactive } from 'vue'

import type { AuthSession, AuthUser } from '@/services/authApi'

export const AUTH_SESSION_KEY = 'ez-nihongo:auth-session:v1'

interface AuthState {
    user: AuthUser | null
    accessToken: string | null
    tokenType: string | null
    expiresAt: string | null
}

const state = reactive<AuthState>({
    user: null,
    accessToken: null,
    tokenType: null,
    expiresAt: null,
})

function clearState(): void {
    state.user = null
    state.accessToken = null
    state.tokenType = null
    state.expiresAt = null
}

function saveSession(session: AuthSession): void {
    state.user = session.user
    state.accessToken = session.accessToken
    state.tokenType = session.tokenType
    state.expiresAt = session.expiresAt
    try {
        window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    } catch {
        // Keep the session available in memory when browser storage is unavailable.
    }
}

function restoreSession(): void {
    try {
        const raw = window.localStorage.getItem(AUTH_SESSION_KEY)
        if (!raw) return
        const value: unknown = JSON.parse(raw)
        if (typeof value !== 'object' || value === null) throw new Error('Invalid session')
        const candidate = value as Partial<AuthSession>
        if (
            !candidate.user ||
            typeof candidate.user.id !== 'string' ||
            typeof candidate.user.email !== 'string' ||
            candidate.user.id === '' ||
            candidate.user.email === '' ||
            typeof candidate.accessToken !== 'string' ||
            candidate.accessToken === '' ||
            typeof candidate.tokenType !== 'string' ||
            typeof candidate.expiresAt !== 'string' ||
            !Number.isFinite(Date.parse(candidate.expiresAt)) ||
            Date.parse(candidate.expiresAt) <= Date.now()
        ) {
            throw new Error('Invalid or expired session')
        }
        state.user = candidate.user
        state.accessToken = candidate.accessToken
        state.tokenType = candidate.tokenType
        state.expiresAt = candidate.expiresAt
    } catch {
        clearState()
        try {
            window.localStorage.removeItem(AUTH_SESSION_KEY)
        } catch {
            // Ignore storage restrictions.
        }
    }
}

function signOut(): void {
    clearState()
    try {
        window.localStorage.removeItem(AUTH_SESSION_KEY)
    } catch {
        // The in-memory session is still cleared.
    }
}

export const auth = {
    state,
    restoreSession,
    saveSession,
    signOut,
}
