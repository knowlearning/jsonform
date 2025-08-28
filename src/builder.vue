<script setup>
import { ref, onMounted } from 'vue'
import * as jsonpatch from 'fast-json-patch'

const props = defineProps({ id: String })
const emit = defineEmits([ 'create', 'update', 'archive' ])

let formBuilderInstance

const builder = ref(null)
const unsaved = ref(false)
const copied = ref(false)
const state = await Agent.state(props.id)

const { auth: { info: { picture } } } = await Agent.environment()

let rendered = false

function handleBuilderUpdate() {
  if (formBuilderInstance) {
    const newFormData = formBuilderInstance.actions.getData('js')
    const patches = jsonpatch.compare(state.formData, newFormData)
    if (patches.length > 0) {
      jsonpatch.applyPatch(state.formData, patches)
    }
    emit('update')
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

function confirmAndArchive() {
  if (confirm("Are you sure you want to remove this item? You will not be able to undo this.")) {
    emit('archive', props.id)
  }
}

function logout() { Agent.logout() }

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

function create() {
  if (confirm('Are you sure? Save this id if you want to edit it again.')) {
    window.location = `/${Agent.uuid()}`
  }
}

</script>

<template>
  <div class="wrapper">
    <div class="top-info">

      <div class="left">
        <img
          :src="picture"
          alt="User Avatar"
          class="avatar"
        />
        <button @click="logout">Log Out</button>
        
      </div>

      <div class="right">
        <h4>
          Form Name and ID:
          <button @click="emit('create')">Create New</button>
        </h4>
        <input v-model="state.name">
        <div class="id-select-wrapper">
          <span
            id="item-id"
            @click="copyId(props.id)"
            style="font-weight: normal;"
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
          <button @click="confirmAndArchive">Remove</button>
        </div>

        <div class="unsaved-warning">
          <span v-show="unsaved">Your form has unsaved changes.</span>
          &nbsp;
        </div>
      </div>

    </div>
    <div ref="builder" />
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}
.top-info {
  display: flex;
  padding: 3px 0 12px 0;
}
.top-info .left {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 40px 2px 10px;
}
.top-info .right {
  display: flex;
  flex-direction: column;
  margin-top: 1.5em;

}
.top-info .right h4 {
  display: flex;
  justify-content: space-between;
  margin: 0 0 0.5em 0;
}
.top-info #item-id {
  cursor: pointer;
  user-select: none;  
}
.top-info #copied {
  font-size: 0.75em;
  color: grey;
  margin-left: 4px;
}

.top-info .unsaved-warning { color: red; }

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: inline-block;
  vertical-align: middle;
  margin: 0.5em;
}

</style>
