import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { vReveal } from '@/directives/reveal.js'
import '@/assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('reveal', vReveal)
app.mount('#app')
