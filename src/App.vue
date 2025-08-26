<script setup>
import { ref, onMounted } from 'vue'
import Builder from './builder.vue'
import Renderer from './renderer.vue'

const id = ref(null)
const embedded = Agent.embedded

onMounted(async () => {
  try {
    const formPathName = window.location.pathname.slice(1)
    const scopeNameMetadata = await Agent.metadata(formPathName)
    id.value = scopeNameMetadata.id
  } catch (error) {
    console.error('Failed to load metadata:', error)
  }
})
</script>

<template>
  <Suspense>
    <div id="container">
      <Builder v-if="id && !embedded" :id="id" />
      <Renderer v-if="id" :id="id" />
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
