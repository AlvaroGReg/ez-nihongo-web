import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import { locale, setLocale } from '@/i18n'
import router from '@/router'
import ExerciseView from '@/views/ExerciseView.vue'

describe('ExerciseView', () => {
    const previousLocale = locale.value

    afterEach(async () => {
        setLocale(previousLocale)
        await router.push('/')
    })

    it('shows the kanji warning toast when entering kanji exercises', async () => {
        setLocale('es')
        await router.push('/exercises/kanji')
        const wrapper = mount(ExerciseView, { global: { plugins: [router] } })
        await flushPromises()

        expect(wrapper.get('.kanji-warning-toast').text()).toBe(
            'La sección de kanji no ha sido aprobada por profesionales de la enseñanza de japonés y no se recomienda usar en su estado actual. Trabajaremos para mejorarla.',
        )

        wrapper.unmount()
    })
})
