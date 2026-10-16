<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { t } from '@/i18n'

const basePath = import.meta.env.BASE_URL
</script>

<template>
    <RouterLink class="floating-contact-link" to="/about" :aria-label="t('about')" :title="t('about')">
        <img :src="`${basePath}res/logos/agreg_blue.png`" alt="" />
    </RouterLink>
</template>

<style scoped>
.floating-contact-link {
    position: fixed;
    bottom: 5px;
    left: 50%;
    z-index: 8;
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--surface);
    box-shadow: 0 0.2rem 0.8rem rgb(33 49 77 / 20%);
    transform: translateX(-50%);

    img {
        width: 1.75rem;
        height: 1.75rem;
        object-fit: contain;
    }
}
</style>
