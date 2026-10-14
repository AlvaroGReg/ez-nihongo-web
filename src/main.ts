import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { testSession } from './stores/testSession'
import { auth } from './stores/auth'
import './style.css'

testSession.restoreSession()
auth.restoreSession()

const app = createApp(App)

app.use(router)

app.mount('#app')
