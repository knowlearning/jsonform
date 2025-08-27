<script setup>
import { ref, onMounted } from 'vue'
import { validate as isUUID } from 'uuid'
import Builder from './builder.vue'
import Renderer from './renderer.vue'

const id = ref(null)
const embedded = Agent.embedded
const updated = ref(Date.now())
const ownerIsUser = ref(false)
const validPath = ref(null)

onMounted(async () => {
  const { auth: { user } } = await Agent.environment()
  const pathId = window.location.pathname.slice(1)
  validPath.value = isUUID(pathId)
  if (validPath) {
    const md = await Agent.metadata(pathId)
    ownerIsUser.value = md.owner === user

    if (ownerIsUser && !md.active_type) {
      scopeNameMetadata.active_type = "application/json;type=kl-json-form&version=1.0.1"
    }

    id.value = md.id
  }
})

function create() {
  window.location = `/${Agent.uuid()}`
}

async function copy() {
  const { formData=[] } = await Agent.state(id.value)
  const myId = Agent.uuid()
  const myState = await Agent.state(myId)
  myState.formData = JSON.parse(JSON.stringify(formData))
  window.location = `/${myId}`
}
</script>

<template>
  <Suspense>
    <div
      id="container"
      v-if="validPath && id"
    >
      <Builder
        v-if="!embedded && ownerIsUser"
        :id="id"
        @update="updated = Date.now()"
      />
      <div>
        <button
          v-if="!embedded && !ownerIsUser"
          @click="copy"
        >
          Make my own copy to edit
        </button>
        <Renderer
          :key="updated"
          :id="id"
        />
      </div>
    </div>
    <div
      id="container"
      v-else
    >
      <button @click="create">Create Form</button>
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
