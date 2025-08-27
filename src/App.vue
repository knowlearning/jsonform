<script setup>
import { ref, onMounted } from 'vue'
import { validate as isUUID } from 'uuid'
import Builder from './builder.vue'
import Renderer from './renderer.vue'
import Loading from './loading.vue'

const id = ref(null)
const embedded = Agent.embedded
const updated = ref(Date.now())
const ownerIsUser = ref(false)
const validPath = ref(null)
const loading = ref(true)

const FORM_TYPE = "application/json;type=kl-json-form&version=1.0.1"

onMounted(async () => {
  const { auth: { user } } = await Agent.environment()
  const pathId = window.location.pathname.slice(1)
  validPath.value = isUUID(pathId)
  if (validPath) {
    const md = await Agent.metadata(pathId)
    ownerIsUser.value = md.owner === user
    id.value = md.id
  }
  loading.value = false
})

async function create(formData = [], name = "New Form") {
  const id = Agent.uuid()
  const state = await Agent.state(id)
  state.name = name
  state.formData = formData
  const md = await Agent.metadata(id)
  md.active_type = FORM_TYPE
  await Agent.synced()
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
      id="container"
      v-else-if="validPath === false"
    >
      <button @click="create()">Create Form</button>
    </div>
    <div
      id="container"
      v-else-if="validPath && id"
    >
      <Builder
        v-if="!embedded && ownerIsUser"
        :id="id"
        @update="updated = Date.now()"
        @create="create()"
      />
      <div>
        <button
          v-if="!embedded && !ownerIsUser"
          @click="copy(id)"
        >
          Make my own copy to edit
        </button>
        <Renderer
          :key="updated"
          :id="id"
        />
      </div>
    </div>
  </Suspense>
</template>

<style scoped>
#container {
  display: flex;
  gap: 1rem;
}

#container > * {
  flex-grow: 1;
}
</style>
