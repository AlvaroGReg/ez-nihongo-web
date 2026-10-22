<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { t } from '@/i18n'
import { AuthApiError, authenticate } from '@/services/authApi'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const isRegister = ref(route.query.mode === 'register')
const isSubmitting = ref(false)
const error = ref('')
const rememberMe = ref(false)
const form = reactive({ email: '', password: '' })

async function submit(): Promise<void> {
    error.value = ''
    isSubmitting.value = true
    try {
        const session = await authenticate(
            isRegister.value ? 'register' : 'login',
            form.email.trim(),
            form.password,
            rememberMe.value,
        )
        auth.saveSession(session)
        const redirect = route.query.redirect
        const destination =
            typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
                ? redirect
                : '/'
        await router.push(destination)
    } catch (cause) {
        error.value = cause instanceof AuthApiError ? cause.code : 'authUnknownError'
    } finally {
        form.password = ''
        isSubmitting.value = false
    }
}

function toggleMode(): void {
    isRegister.value = !isRegister.value
    error.value = ''
    rememberMe.value = false
}
</script>

<template>
    <main class="page-shell auth-page">
        <section class="hero-card auth-card" aria-labelledby="auth-title">
            <p class="eyebrow">{{ t('appTitle') }}</p>
            <h1 id="auth-title">{{ isRegister ? t('registerTitle') : t('loginTitle') }}</h1>
            <p class="hero-copy">
                {{ isRegister ? t('registerDescription') : t('loginDescription') }}
            </p>

            <form class="setup-form" @submit.prevent="submit">
                <label class="field" for="auth-email">
                    <span>{{ t('email') }}</span>
                    <input
                        id="auth-email"
                        v-model="form.email"
                        type="email"
                        name="email"
                        autocomplete="email"
                        maxlength="256"
                        required
                    />
                </label>
                <label class="field" for="auth-password">
                    <span>{{ t('password') }}</span>
                    <input
                        id="auth-password"
                        v-model="form.password"
                        type="password"
                        name="password"
                        :autocomplete="isRegister ? 'new-password' : 'current-password'"
                        maxlength="128"
                        required
                    />
                </label>
                <label v-if="!isRegister" class="remember-me-field">
                    <input v-model="rememberMe" type="checkbox" name="rememberMe" />
                    <span>{{ t('rememberMe') }}</span>
                </label>
                <p v-if="isRegister" class="auth-hint">{{ t('passwordRequirements') }}</p>
                <p v-if="error" class="message message-error" role="alert">{{ t(error) }}</p>
                <button class="button button-primary button-wide" type="submit" :disabled="isSubmitting">
                    {{ isSubmitting ? t('authSubmitting') : isRegister ? t('register') : t('login') }}
                </button>
            </form>

            <p class="auth-switch">
                {{ isRegister ? t('haveAccount') : t('needAccount') }}
                <button class="button button-quiet" type="button" @click="toggleMode">
                    {{ isRegister ? t('login') : t('register') }}
                </button>
            </p>
            <RouterLink class="auth-back" to="/">{{ t('backToSetup') }}</RouterLink>
        </section>
    </main>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
}

.auth-card {
    max-width: 32rem;
}

.auth-hint,
.auth-switch {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
}

.remember-me-field {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--muted);
    font-size: 0.9rem;

    input {
        width: 1rem;
        height: 1rem;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
    }
}

.auth-switch {
    margin-top: 1.5rem;
}

.auth-switch .button {
    display: inline;
    margin-left: 0.2rem;
}

.auth-back {
    display: inline-block;
    margin-top: 1rem;
    color: #7f91ef;
    font-weight: 700;
}
</style>
