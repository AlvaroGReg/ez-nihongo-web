import { reactive } from 'vue'

import { refreshAuthentication, revokeAuthentication } from '@/services/authApi'
import type { AuthSession, AuthUser } from '@/services/authApi'

const LEGACY_AUTH_SESSION_KEY = 'ez-nihongo:auth-session:v1'
const REFRESH_LOCK_NAME = 'ez-nihongo:auth-refresh'

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

let restoration: Promise<void> | null = null
let inFlightSignOut: Promise<void> | null = null

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
}

async function requestRefresh(): Promise<AuthSession | null> {
    const lockManager = globalThis.navigator?.locks
    if (!lockManager) return refreshAuthentication()

    return lockManager.request(REFRESH_LOCK_NAME, refreshAuthentication)
}

function restoreSession(): Promise<void> {
    if (restoration) return restoration

    const pendingRestoration = (async () => {
        try {
            // Remove sessions written by previous versions; access tokens are memory-only now.
            window.localStorage.removeItem(LEGACY_AUTH_SESSION_KEY)
        } catch {
            // Storage may be disabled; no authentication data is written here.
        }

        try {
            const session = await requestRefresh()
            if (session) saveSession(session)
            else clearState()
        } catch {
            clearState()
        }
    })()
    restoration = pendingRestoration.finally(() => {
        restoration = null
    })

    return restoration
}

function signOut(): Promise<void> {
    clearState()
    if (inFlightSignOut) return inFlightSignOut

    inFlightSignOut = revokeAuthentication()
        .catch(() => undefined)
        .finally(() => {
            inFlightSignOut = null
        })
    return inFlightSignOut
}

export const auth = {
    state,
    restoreSession,
    saveSession,
    signOut,
}
