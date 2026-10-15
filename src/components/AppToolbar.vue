<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { locale, setLocale, t } from '@/i18n'
import { auth } from '@/stores/auth'
import { theme, toggleTheme } from '@/stores/theme'

const isMenuOpen = ref(false)

function changeLocale(value: string): void {
    if (value === 'en' || value === 'es') setLocale(value)
}

function closeMenu(): void {
    isMenuOpen.value = false
}
</script>

<template>
    <header class="app-toolbar">
        <div class="toolbar-layout">
            <div class="toolbar-navigation">
                <button
                    class="menu-toggle"
                    type="button"
                    :aria-expanded="isMenuOpen"
                    :aria-label="t('openNavigation')"
                    @click="isMenuOpen = !isMenuOpen"
                >
                    <span aria-hidden="true">☰</span>
                </button>
                <nav v-if="isMenuOpen" class="navigation-menu" :aria-label="t('mainNavigation')">
                    <RouterLink to="/exercises" @click="closeMenu">
                        {{ t('exercises') }}
                    </RouterLink>
                    <RouterLink class="dictionary-link" to="/dictionary" @click="closeMenu">
                        {{ t('dictionary') }}
                    </RouterLink>
                </nav>
            </div>

            <RouterLink class="toolbar-brand" to="/" @click="closeMenu">
                {{ t('appTitle') }}
            </RouterLink>

            <nav class="toolbar-actions" :aria-label="t('toolbar')">
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

                <RouterLink
                    v-if="!auth.state.user"
                    class="account-icon-button"
                    to="/auth"
                    :aria-label="t('loginOrRegister')"
                    :title="t('loginOrRegister')"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                        <path d="M19 8h4m-2-2 2 2-2 2" />
                    </svg>
                </RouterLink>
                <button
                    v-else
                    class="account-icon-button"
                    type="button"
                    :aria-label="t('signOut')"
                    :title="t('signOut')"
                    @click="auth.signOut"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 4H5v16h5" />
                        <path d="M14 8l4 4-4 4m4-4H9" />
                    </svg>
                </button>
            </nav>
        </div>
    </header>
</template>

<style lang="scss">
.app-toolbar {
    position: relative;
    z-index: 2;
    width: 100%;
    height: var(--header-height);
    padding-inline: 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);

    .toolbar-layout {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: var(--content-max-width);
        height: 100%;
        margin-inline: auto;
    }

    .toolbar-brand {
        position: absolute;
        left: 50%;
        color: var(--text);
        font-size: 1.2rem;
        font-weight: 800;
        text-decoration: none;
        transform: translateX(-50%);
        white-space: nowrap;
    }

    .toolbar-navigation {
        position: relative;
    }

    .toolbar-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .menu-toggle {
        width: 2.65rem;
        height: 2.65rem;
        border: 1px solid var(--border);
        border-radius: 0.7rem;
        background: var(--surface);
        color: var(--text);
        font-size: 1.2rem;
    }

    .account-icon-button {
        display: grid;
        width: 2.65rem;
        height: 2.65rem;
        place-items: center;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: 0.7rem;
        background: var(--surface);
        color: var(--text);
        cursor: pointer;

        svg {
            width: 1.2rem;
            height: 1.2rem;
            fill: none;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 1.7;
        }
    }

    .navigation-menu {
        position: absolute;
        top: calc(100% + 0.75rem);
        left: 0;
        z-index: 5;
        display: grid;
        min-width: 13rem;
        padding: 0.4rem;
        border: 1px solid var(--border);
        border-radius: 0.8rem;
        background: var(--surface);
        box-shadow: 0 1rem 2rem rgb(33 49 77 / 14%);

        a,
        .dictionary-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 2.8rem;
            padding: 0.65rem 0.75rem;
            border: 0;
            border-radius: 0.5rem;
            background: transparent;
            color: var(--text);
            font-size: 0.95rem;
            text-align: left;
            text-decoration: none;
        }

        a:hover {
            background: var(--secondary-background);
        }
    }

    @media (width <= 560px) {
        padding-inline: 0.75rem;

        .toolbar-actions {
            gap: 0.4rem;
        }

        .toolbar-brand {
            font-size: 1rem;
        }
    }

    @media (width <= 400px) {
        .toolbar-layout {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            gap: 0.5rem;
        }

        .toolbar-brand {
            position: static;
            justify-self: center;
            min-width: 0;
            font-size: 0.82rem;
            transform: none;
        }

        .toolbar-actions {
            min-width: 0;
            gap: 0.25rem;
        }

        .toolbar-language select {
            width: 4.25rem;
            min-width: 0;
            max-width: 4.25rem;
            padding-inline: 0.2rem;
            font-size: 0.75rem;
        }

        .menu-toggle,
        .theme-toggle,
        .account-icon-button {
            width: 2.35rem;
            height: 2.35rem;
        }
    }
}
</style>
