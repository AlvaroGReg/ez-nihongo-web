import { createRouter, createWebHashHistory } from 'vue-router'

import ExerciseView from '@/views/ExerciseView.vue'
import HomeView from '@/views/HomeView.vue'
import AuthView from '@/views/AuthView.vue'
import DictionaryView from '@/views/DictionaryView.vue'
import AboutView from '@/views/AboutView.vue'
import ResultView from '@/views/ResultView.vue'
import TestView from '@/views/TestView.vue'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/exercises', redirect: '/exercises/vocabulary' },
        { path: '/exercises/:type', name: 'exercises', component: ExerciseView },
        { path: '/auth', name: 'auth', component: AuthView },
        { path: '/dictionary', redirect: '/dictionary/kana' },
        { path: '/dictionary/:type', name: 'dictionary', component: DictionaryView },
        { path: '/test', name: 'test', component: TestView },
        { path: '/result', name: 'result', component: ResultView },
        { path: '/about', name: 'about', component: AboutView },
    ],
    scrollBehavior(to) {
        return to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }
    },
})

export default router
