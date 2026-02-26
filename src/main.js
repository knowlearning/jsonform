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

/*
  Custom behavior for radio groups that allow deselect when NOT-required
*/

document.addEventListener('click', function (e) {
  const radio = e.target.closest('input[type="radio"]')
  if (!radio) return

  const groupContainer = radio.closest('.formbuilder-radio-group')
  if (!groupContainer) return

  const groupIsRequired =
    groupContainer.querySelector('.formbuilder-required') ||
    groupContainer.querySelector('input[type="radio"][required]')

  if (groupIsRequired) return

  if (radio.dataset.wasChecked === 'true') {
    radio.checked = false
    radio.dataset.wasChecked = 'false'
    radio.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }

  const groupName = radio.name

  document
    .querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`)
    .forEach(r => r.dataset.wasChecked = 'false')

  radio.dataset.wasChecked = 'true'
})

document.addEventListener('change', function (e) {
  const radio = e.target.closest('input[type="radio"]')
  if (!radio) return

  const groupName = radio.name

  document
    .querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`)
    .forEach(r => r.dataset.wasChecked = 'false')

  if (radio.checked) {
    radio.dataset.wasChecked = 'true'
  }
})

document.addEventListener('change', function (e) {
  const input = e.target.closest('input[type="number"]')
  if (!input) return
  if (!input.hasAttribute('min') && !input.hasAttribute('max')) return
  if (input.value === '') return

  const { validity } = input
  const invalid =
    validity.badInput ||
    validity.rangeUnderflow ||
    validity.rangeOverflow ||
    validity.stepMismatch

  if (invalid) input.value = ''
})