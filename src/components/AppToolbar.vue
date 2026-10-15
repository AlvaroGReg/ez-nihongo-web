<script setup lang="ts">
import { locale, setLocale, t } from '@/i18n'
import { auth } from '@/stores/auth'
import { theme, toggleTheme } from '@/stores/theme'

function changeLocale(value: string): void {
    if (value === 'en' || value === 'es') setLocale(value)
}
</script>

<template>
    <header class="app-toolbar">
        <nav class="toolbar-actions" :aria-label="t('toolbar')">
            <div class="toolbar-account" aria-live="polite">
                <template v-if="auth.state.user">
                    <span class="toolbar-account-label">
                        {{ t('signedInAs', { email: auth.state.user.email }) }}
                    </span>
                    <button class="button button-quiet toolbar-button" type="button" @click="auth.signOut">
                        {{ t('signOut') }}
                    </button>
                </template>
                <RouterLink v-else class="button button-secondary toolbar-button" to="/auth">
                    {{ t('loginOrRegister') }}
                </RouterLink>
            </div>

            <label class="toolbar-language">
                <span class="visually-hidden">{{ t('language') }}</span>
                <select
                    :value="locale"
                    :aria-label="t('language')"
                    @change="changeLocale(($event.target as HTMLSelectElement).value)"
                >
                    <option value="en">{{ t('english') }}</option>
                    <option value="es">{{ t('spanish') }}</option>
                </select>
            </label>

            <button
                class="theme-toggle"
                type="button"
                :aria-label="theme === 'light' ? t('switchToDarkTheme') : t('switchToLightTheme')"
                @click="toggleTheme"
            >
                {{ theme === 'light' ? '🌙' : '☀️' }}
            </button>
        </nav>
    </header>
</template>

<style lang="scss">
.app-toolbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    height: var(--header-height);
    padding: 20px;
    position: relative;
    width: 100%;
    z-index: 2;

    .toolbar-actions {
        margin-inline: auto;
        max-width: var(--content-max-width);
    }

    @media (width <= 560px) {
        padding-inline: 0.75rem;
    }
}
</style>
