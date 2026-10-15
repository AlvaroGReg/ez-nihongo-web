<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppToolbar from '@/components/AppToolbar.vue'
import { t } from '@/i18n'
import { testSession } from '@/stores/testSession'

const router = useRouter()

function resume(): void {
    testSession.resumeSession()
    void router.push('/test')
}

function abandon(): void {
    testSession.abandonSession()
    void router.push('/')
}

</script>

<template>
    <AppToolbar />
    <RouterView />

    <div v-if="testSession.state.needsResume" class="modal-backdrop" role="presentation">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="resume-title">
            <p class="eyebrow">{{ t('savedProgress') }}</p>
            <h2 id="resume-title">{{ t('resumeTest') }}</h2>
            <p>{{ t('unfinishedTest') }}</p>
            <div class="button-row">
                <button class="button button-primary" type="button" @click="resume">
                    {{ t('resume') }}
                </button>
                <button class="button button-secondary" type="button" @click="abandon">
                    {{ t('abandon') }}
                </button>
            </div>
        </section>
    </div>
</template>

<style scoped></style>
