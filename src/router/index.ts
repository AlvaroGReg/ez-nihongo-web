import { createRouter, createWebHashHistory } from 'vue-router'

import ExerciseView from '@/views/ExerciseView.vue'
import HomeView from '@/views/HomeView.vue'
import AuthView from '@/views/AuthView.vue'
import ResultView from '@/views/ResultView.vue'
import TestView from '@/views/TestView.vue'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/exercises', name: 'exercises', component: ExerciseView },
        { path: '/auth', name: 'auth', component: AuthView },
        { path: '/test', name: 'test', component: TestView },
        { path: '/result', name: 'result', component: ResultView },
    ],
})

export default router
