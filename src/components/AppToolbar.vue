<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { locale, setLocale, t } from '@/i18n'
import { theme, toggleTheme } from '@/stores/theme'

const isMenuOpen = ref(false)
const basePath = import.meta.env.BASE_URL

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
                    <RouterLink to="/about" @click="closeMenu">
                        {{ t('about') }}
                    </RouterLink>
                </nav>
            </div>

            <RouterLink class="toolbar-brand" to="/" @click="closeMenu">
                <img
                    :src="`${basePath}res/logos/ez-nihongo/logo-horizontal-${theme === 'light' ? 'blue' : 'white'}.svg`"
                    alt="EZ Nihongo"
                />
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
        display: block;
        width: 7.125rem;
        text-decoration: none;
        transform: translateX(-50%);
        white-space: nowrap;

        img {
            display: block;
            width: 100%;
            height: auto;
        }
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
            width: 6rem;
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
            width: 4.875rem;
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
        .theme-toggle {
            width: 2.35rem;
            height: 2.35rem;
        }
    }
}
</style>
