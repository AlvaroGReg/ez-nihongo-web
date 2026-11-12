<script setup lang="ts">
import { computed } from 'vue'

import { splitSearchMatches } from '@/utils/textSearch'

const props = defineProps<{ text: string; query: string }>()

const segments = computed(() => splitSearchMatches(props.text, props.query))
</script>

<template>
    <span class="search-highlight">
        <template v-for="(segment, index) in segments" :key="index">
            <mark v-if="segment.matched" class="search-match">{{ segment.text }}</mark>
            <template v-else>{{ segment.text }}</template>
        </template>
    </span>
</template>

<style scoped>
.search-match {
    padding: 0;
    background: transparent;
    color: inherit;
    text-decoration: underline 2px #f1c84b;
    text-underline-offset: 0.12em;
}
</style>
