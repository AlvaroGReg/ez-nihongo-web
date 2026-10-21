<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from 'vue'

import { t } from '@/i18n'

const props = defineProps<{ active: boolean }>()
const isVisible = shallowRef(false)
let timeout: ReturnType<typeof setTimeout> | undefined

watch(
    () => props.active,
    (active) => {
        if (timeout) clearTimeout(timeout)
        isVisible.value = active

        if (active) {
            timeout = setTimeout(() => {
                isVisible.value = false
            }, 8000)
        }
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    if (timeout) clearTimeout(timeout)
})
</script>

<template>
    <Transition name="kanji-warning">
        <p v-if="isVisible" class="kanji-warning-toast message message-error" role="alert">
            {{ t('kanjiProfessionalWarning') }}
        </p>
    </Transition>
</template>

<style scoped>
.kanji-warning-toast {
    position: fixed;
    z-index: 1000;
    inset: auto 1rem 1rem;
    max-width: 38rem;
    margin: 0 auto;
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 18%);
}

.kanji-warning-enter-active,
.kanji-warning-leave-active {
    transition: opacity 180ms ease, transform 180ms ease;
}

.kanji-warning-enter-from,
.kanji-warning-leave-to {
    opacity: 0;
    transform: translateY(0.75rem);
}
</style>
