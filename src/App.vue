<script setup>
import { ref, onMounted } from 'vue'
import Builder from './builder.vue'
import Renderer from './renderer.vue'

const id = ref(null)
const embedded = Agent.embedded
const updated = ref(Date.now())

onMounted(async () => {
  try {
    const formPathName = window.location.pathname.slice(1)
    const scopeNameMetadata = await Agent.metadata(formPathName)
    // i don't care that we're re-setting this on each load
    scopeNameMetadata.active_type = "application/json;type=kl-json-form&version=1.0.1"
    id.value = scopeNameMetadata.id
  } catch (error) {
    console.error('Failed to load metadata:', error)
  }
})
</script>

<template>
  <Suspense>
    <div id="container">
      <Builder
        v-if="id && !embedded"
        :id="id"
        @update="updated = Date.now()"
      />
      <Renderer
        v-if="id"
        :key="updated"
        :id="id"
      />
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
