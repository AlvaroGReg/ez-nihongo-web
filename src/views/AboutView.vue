<script setup lang="ts">
import { t } from '@/i18n'

const basePath = import.meta.env.BASE_URL
</script>

<template>
    <main class="page-shell about-page">
        <section class="about-card" aria-labelledby="about-title">
            <p class="eyebrow">EZ Nihongo</p>
            <h1 id="about-title">{{ t('about') }}</h1>

            <section class="about-section" aria-labelledby="project-title">
                <h2 id="project-title">{{ t('project') }}</h2>
                <p class="about-description">{{ t('aboutDescription') }}</p>
            </section>

            <section id="contact" class="about-section contact-section" aria-labelledby="contact-title">
                <h2 id="contact-title">{{ t('contact') }}</h2>
                <div class="contact-links">
                    <a href="https://github.com/AlvaroGREG" target="_blank" rel="noreferrer">
                        <svg class="contact-icon github-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.16 1.17a10.9 10.9 0 0 1 5.75 0c2.2-1.48 3.16-1.17 3.16-1.17.63 1.57.23 2.73.11 3.02.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.37-5.24 5.65.41.36.77 1.06.77 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
                            />
                        </svg>
                        <span>GitHub</span>
                    </a>
                    <a href="mailto:alvaro.gracia.reg@gmail.com">
                        <svg class="contact-icon mail-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m4 7 8 6 8-6" />
                        </svg>
                        <span>alvaro.gracia.reg@gmail.com</span>
                    </a>
                    <a href="https://alvarogreg.github.io/WebPortfolio/" target="_blank" rel="noreferrer">
                        <img class="portfolio-icon" :src="`${basePath}res/logos/portfolio.png`" alt="" />
                        <span>Portfolio</span>
                    </a>
                </div>
            </section>

            <section class="about-section" aria-labelledby="sources-title">
                <h2 id="sources-title">{{ t('dataSources') }}</h2>
                <ul class="source-list">
                    <li>
                        <strong>{{ t('vocabularyExercise') }}:</strong>
                        {{ t('vocabularySource') }}
                    </li>
                    <li>
                        <strong>{{ t('kanjiExercise') }}:</strong>
                        {{ t('kanjiSource') }}
                    </li>
                    <li>
                        <strong>{{ t('kanaExercise') }}:</strong>
                        {{ t('kanaSource') }}
                    </li>
                </ul>
                <p class="source-reference">
                    <a href="https://www.tanos.co.uk/jlpt/" target="_blank" rel="noreferrer">tanos.co.uk/jlpt</a>
                    ·
                    <a href="https://github.com/AlvaroGReg/ez-nihongo-platform" target="_blank" rel="noreferrer">ez-nihongo-platform</a>
                </p>
            </section>
        </section>
    </main>
</template>

<style scoped>
.about-page {
    display: grid;
    justify-items: center;
}

.about-card {
    width: min(100%, 780px);
    padding: clamp(1.5rem, 5vw, 3rem);
    border: 1px solid var(--border);
    border-radius: 1.5rem;
    background: var(--surface);
    box-shadow: 0 1.5rem 4rem rgb(33 49 77 / 10%);

    h1 {
        margin-bottom: 0.75rem;
    }

    .about-description,
    .source-list,
    .source-reference {
        color: var(--muted);
        line-height: 1.6;
    }

    .about-section {
        margin-top: 2.5rem;
        scroll-margin-top: 1.5rem;

        h2 {
            margin-bottom: 1rem;
        }
    }

    .contact-links {
        display: grid;
        gap: 0.75rem;

        a {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            min-height: 3.25rem;
            padding: 0.65rem 0.8rem;
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            color: var(--text);
            text-decoration: none;
        }

        a:hover {
            background: var(--secondary-background);
        }

        img,
        .contact-icon,
        .portfolio-icon {
            display: grid;
            width: 1.75rem;
            height: 1.75rem;
            flex: 0 0 1.75rem;
            place-items: center;
            object-fit: contain;
        }

        .mail-icon {
            fill: none;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 1.8;
        }
    }

    .source-list {
        display: grid;
        gap: 0.85rem;
        padding-left: 1.25rem;

        li::marker {
            color: #5167c7;
        }
    }

    .source-reference {
        margin-bottom: 0;

        a {
            color: var(--selected-text);
        }
    }
}

</style>
