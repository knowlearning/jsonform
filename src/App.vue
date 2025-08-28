<script setup>
import { ref, reactive, onMounted } from 'vue'
import { validate as isUUID } from 'uuid'
import Builder from './builder.vue'
import Renderer from './renderer.vue'
import FormSelector from './form-selector.vue'
import Loading from './loading.vue'

const activeId = ref(null)

const myLocalForms = reactive({})
let myKLForms = null

const embedded = Agent.embedded
const updated = ref(Date.now())
const ownerIsUser = ref(false)
const validPath = ref(null)
const loading = ref(true)

const FORM_TYPE = "application/json;type=kl-json-form&version=1.0.1"

onMounted(async () => {
  myKLForms = await Agent.state('my-forms')
  const myACTIVEKLForms = Object.fromEntries(
    Object.entries(myKLForms).filter(([_, v]) => v)
  )
  Object.assign(myLocalForms, myACTIVEKLForms) 

  const { auth: { user } } = await Agent.environment()
  const pathId = window.location.pathname.slice(1)
  validPath.value = isUUID(pathId)
  if (validPath.value) {
    const md = await Agent.metadata(pathId)
    ownerIsUser.value = md.owner === user
    activeId.value = md.id
  }
  loading.value = false
})

async function create(formData = [], name = "New Form") {
  const newId = Agent.uuid()
  const state = await Agent.state(newId)
  state.name = name
  state.formData = formData
  const md = await Agent.metadata(newId)
  md.active_type = FORM_TYPE

  myKLForms[newId] = true
  myLocalForms[newId] = true

  await Agent.synced()
  window.location = `/${newId}`
}

function archive(id) {
  console.log('attemptive to archive', id)
  myKLForms[id] = false
  myLocalForms[id] = false
  window.location = '/'
}

function navToFormId(id) {
  console.log(id)
  window.location = `/${id}`
}

async function copy(id) {
  const { formData = [], name = "New Form" } = await Agent.state(id)
  create(
    JSON.parse(JSON.stringify(formData)),
    `Copy of ${name}`
  )
}
</script>

<template>
  <Suspense>
    <Loading v-if="loading" v-model="loading"  />
    <div
      id="no-id-selected-container"
      v-else-if="validPath === false"
    >
      <button @click="create()">Create New Form</button>
      <FormSelector
        :forms="myLocalForms"
        :activeId="activeId"
        @update="navToFormId"
      />
    </div>
    <div
      id="container"
      v-else-if="validPath && activeId"
    >
      <Builder
        v-if="!embedded && ownerIsUser"
        :id="activeId"
        @update="updated = Date.now()"
        @create="create()"
        @archive="archive"
      />
      <div>
        <button
          v-if="!embedded && !ownerIsUser"
          @click="copy(activeId)"
        >
          Make my own copy to edit
        </button>
        <Renderer
          :key="updated"
          :id="activeId"
        />
      </div>
    </div>
  </Suspense>
</template>

<style scoped>
#no-id-selected-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

}
#container {
  display: flex;
  gap: 1rem;
}

#container > * {
  flex-grow: 1;
}
</style>
