<script setup lang="ts">
import { t } from '@/i18n'
import type { JlptLevel } from '@/types/domain'

const selectedLevels = defineModel<JlptLevel[]>({ required: true })
const levels: JlptLevel[] = [5, 4, 3, 2, 1]
</script>

<template>
    <fieldset class="level-filter">
        <legend>{{ t('dictionaryJlptFilter') }}</legend>
        <label
            v-for="level in levels"
            :key="level"
            class="level-option"
            :class="{ 'level-option-selected': selectedLevels.includes(level) }"
        >
            <input v-model="selectedLevels" class="level-checkbox" type="checkbox" :value="level" />
            <span>JLPT N{{ level }}</span>
        </label>
    </fieldset>
</template>

<style scoped>
.level-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem 1rem;
    margin: 0;
    padding: 0;
    border: 0;
    color: var(--muted);
    font-weight: 700;

    legend {
        margin-right: 0.9rem;
        padding: 0.4rem 0;
    }

    .level-option {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.55rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
    }

    .level-option-selected {
        border-color: var(--selected-text);
        background: var(--selected-background);
        color: var(--selected-text);
    }

    .level-option:focus-within {
        outline: 2px solid var(--selected-text);
        outline-offset: 2px;
    }

    .level-checkbox {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
}
</style>
