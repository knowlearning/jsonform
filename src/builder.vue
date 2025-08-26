<script setup>
import { ref, onMounted } from 'vue'
import * as jsonpatch from 'fast-json-patch'

const formPathName = window.location.pathname.slice(1)
const props = defineProps({ id: String })

let formBuilderInstance

const builder = ref(null)
const unsaved = ref(false)
const copied = ref(false)
const state = await Agent.state(props.id)

if (!state.formData) state.formData = []

let rendered = false

function handleBuilderUpdate() {
  if (formBuilderInstance) {
    const newFormData = formBuilderInstance.actions.getData('js')
    const patches = jsonpatch.compare(state.formData, newFormData)
    if (patches.length > 0) {
      jsonpatch.applyPatch(state.formData, patches)
    }
  }
  unsaved.value = false
}

onMounted(async () => {
  formBuilderInstance = await $(builder.value).formBuilder({
    formData: JSON.parse(JSON.stringify(state.formData)),
    onSave: handleBuilderUpdate,
    onAddField: () => unsaved.value = true,
    onRemoveField: () => unsaved.value = true,
    onUpdateField: () => unsaved.value = true,
    onOpenFieldEdit: () => unsaved.value = true 
  }).promise
  unsaved.value = false // prevent marked as "unsaved" on init
})

async function copyId(id) {
  copied.value = true
  setTimeout(() => copied.value = false, 1000)  
  await copyToClipboard(id)
}

// from da chat godz
async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Clipboard write failed:', err)
    }
  } else {
    // fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed' // avoid scrolling
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      console.log('Copied to clipboard via fallback:', text)
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }
    document.body.removeChild(textarea)
  }
}

</script>

<template>
  <div class="wrapper">
    <div class="top-info">
      <div>
        <h4>Editing Form:</h4>
        <div>PATH: {{ formPathName }}</div>
        <div>ID:
          <span
            id="item-id"
            @click="copyId(props.id)"
          >
            {{ props.id }}
          </span>
          <span
            id="copied"
            :style="{
              opacity: copied ? 1 : 0,
              transition: copied ? 'none' : 'opacity 1s'
            }"
          >
            Copied
          </span>
        </div>
      </div>
      <div class="unsaved-warning" v-show="unsaved">Your form has unsaved changes</div>
    </div>
    <div ref="builder" />
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}
.top-info { height: 80px; }
.top-info h4 { margin: 0; }
.top-info #item-id {
  cursor: pointer;
  user-select: all;  
}
.top-info #copied {
  font-size: 0.75em;
  color: grey;
  margin-left: 4px;
}

.top-info .unsaved-warning { color: red; }
</style>
