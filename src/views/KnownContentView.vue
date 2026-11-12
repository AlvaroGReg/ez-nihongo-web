<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import KnownContentAddDialog from '@/components/known-content/KnownContentAddDialog.vue'
import { locale, t } from '@/i18n'
import type { KnownContentType } from '@/services/knownContent'
import { auth } from '@/stores/auth'
import { knownContent } from '@/stores/knownContent'
import { includesSearchText } from '@/utils/textSearch'

const router = useRouter()
const route = useRoute()
const type = ref<KnownContentType>('vocabulary')
const level = ref('all')
const search = ref('')
const showAdd = ref(false)
const removing = ref<string | null>(null)
const removeError = ref(false)

onMounted(async () => {
    await auth.restoreSession()
    if (!auth.state.accessToken) {
        await router.replace({ name: 'auth', query: { redirect: route.fullPath } })
        return
    }
    await load()
})

watch(locale, () => { if (auth.state.accessToken) void knownContent.refresh({ language: locale.value }) })

async function load(): Promise<void> {
    try { await knownContent.load({ language: locale.value }) } catch { /* recoverable state is rendered below */ }
}

const typeItems = computed(() => knownContent.items.value.filter((item) => item.contentType === type.value))
const counts = computed(() => ({
    vocabulary: knownContent.items.value.filter((item) => item.contentType === 'vocabulary').length,
    kanji: knownContent.items.value.filter((item) => item.contentType === 'kanji').length,
}))
const visibleItems = computed(() => typeItems.value.filter((item) => {
    if (level.value !== 'all' && (item.source !== 'catalog' || item.content.level !== Number(level.value))) return false
    const contentText = item.contentType === 'vocabulary'
        ? [item.content.word, item.content.reading, item.content.romaji, item.content.meaning]
        : [item.content.kanji, ...item.content.readings, ...item.content.meanings]
    return includesSearchText(contentText, search.value)
}))

async function removeItem(id: string): Promise<void> {
    removing.value = id
    removeError.value = false
    try { await knownContent.remove(id) } catch { removeError.value = true } finally { removing.value = null }
}
</script>

<template>
    <main class="page-shell known-content-page">
        <section class="hero-card" aria-labelledby="known-content-title">
            <div class="page-heading">
                <div><p class="eyebrow">{{ t('appTitle') }}</p><h1 id="known-content-title">{{ t('myVocabularyTitle') }}</h1>
                    <p class="hero-copy">{{ t('knownContentDescription') }}</p></div>
                <button class="button button-primary" type="button" @click="showAdd = true">＋ {{ t('knownContentAdd') }}</button>
            </div>
            <div class="type-tabs" role="tablist" :aria-label="t('knownContentType')">
                <button type="button" role="tab" :aria-selected="type === 'vocabulary'" @click="type = 'vocabulary'; level = 'all'">{{ t('vocabularyExercise') }} <span>{{ counts.vocabulary }}</span></button>
                <button type="button" role="tab" :aria-selected="type === 'kanji'" @click="type = 'kanji'; level = 'all'">{{ t('kanjiExercise') }} <span>{{ counts.kanji }}</span></button>
            </div>
            <div class="list-controls">
                <label class="field"><span>{{ t('search') }}</span><input v-model="search" type="search" /></label>
                <label class="field"><span>{{ t('knownContentLevelFilter') }}</span><select v-model="level"><option value="all">{{ t('allLevels') }}</option><option v-for="item in [5, 4, 3, 2, 1]" :key="item" :value="String(item)">N{{ item }}</option></select></label>
            </div>
            <p v-if="knownContent.loading.value" role="status">{{ t('knownContentLoading') }}</p>
            <div v-else-if="knownContent.error.value" class="empty-state" role="alert"><p>{{ t('knownContentLoadError') }}</p><button class="button button-secondary" type="button" @click="load">{{ t('retry') }}</button></div>
            <div v-else-if="!typeItems.length" class="empty-state"><p>{{ t('knownContentEmpty') }}</p><button class="button button-secondary" type="button" @click="showAdd = true">{{ t('knownContentAdd') }}</button></div>
            <div v-else-if="!visibleItems.length" class="empty-state"><p>{{ t('knownContentNoMatches') }}</p></div>
            <ul v-else class="known-list">
                <li v-for="item in visibleItems" :key="item.id">
                    <div v-if="item.contentType === 'vocabulary'" class="item-content"><strong>{{ item.content.word }}</strong><span>{{ item.content.reading }} · {{ item.content.romaji }}</span><span>{{ item.content.meaning }}</span></div>
                    <div v-else class="item-content"><strong class="kanji-word">{{ item.content.kanji }}</strong><span>{{ item.content.readings.join(' · ') }}</span><span>{{ item.content.meanings.join(', ') }}</span></div>
                    <div class="item-meta"><span class="source-badge">{{ item.source === 'catalog' ? t('knownContentCatalog') : t('knownContentCustom') }}</span><span v-if="item.source === 'catalog' && item.content.level">N{{ item.content.level }}</span></div>
                    <button class="button button-quiet remove-button" type="button" :disabled="removing !== null" :aria-label="t('knownContentRemove')" @click="removeItem(item.id)">{{ removing === item.id ? t('authSubmitting') : t('knownContentRemove') }}</button>
                </li>
            </ul>
            <p v-if="removeError" class="message message-error" role="alert">{{ t('knownContentRemoveError') }}</p>
        </section>
        <KnownContentAddDialog v-if="showAdd" :content-type="type" @close="showAdd = false" @saved="load" />
    </main>
</template>

<style scoped>
.known-content-page { display: grid; justify-items: center; }
.known-content-page .hero-card { max-width: none; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.page-heading h1 { margin: 0; }
.page-heading .hero-copy { margin-block: .5rem 0; }
.type-tabs { display: flex; gap: .5rem; margin-block: 1.5rem 1rem; border-bottom: 1px solid var(--border); }
.type-tabs button { display: flex; align-items: center; gap: .5rem; padding: .7rem 1rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--text); }
.type-tabs button[aria-selected="true"] { border-bottom-color: #7f91ef; font-weight: 700; }
.type-tabs span { color: var(--muted); }
.list-controls { display: grid; grid-template-columns: minmax(0, 1fr) 12rem; gap: 1rem; margin-bottom: 1rem; }
.known-list { display: grid; gap: .65rem; padding: 0; list-style: none; }
.known-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: .8rem; }
.item-content { display: grid; gap: .2rem; }
.item-content span, .item-meta { color: var(--muted); font-size: .9rem; }
.item-content strong { color: var(--text); font-size: 1.15rem; }
.item-content .kanji-word { font-size: 2rem; }
.item-meta { display: flex; align-items: center; gap: .65rem; }
.source-badge { padding: .25rem .5rem; border-radius: 99px; background: var(--secondary-background); }
.empty-state { display: grid; justify-items: center; gap: .75rem; padding: 2.5rem 1rem; color: var(--muted); text-align: center; }
@media (width <= 640px) { .page-heading { flex-direction: column; } .list-controls { grid-template-columns: 1fr; } .known-list li { grid-template-columns: minmax(0, 1fr) auto; } .item-meta { grid-column: 1; } .remove-button { grid-column: 2; grid-row: 1 / span 2; } }
</style>
