import Agent from '@knowlearning/agents'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Loading from './loading.vue'

window.Agent = Agent

const overlayApp = createApp(Loading, { modelValue: true, message: 'Initializing…' })
overlayApp.mount('#app')

const { auth: { provider } } = await Agent.environment()

if (provider === 'anonymous') Agent.login('google')

overlayApp.unmount()

createApp(App).mount('#app')
