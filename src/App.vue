<script setup>
  import Builder from './builder.vue'
  import Renderer from './renderer.vue'

  const id = window.location.pathname.slice(1)
  const embedded = Agent.embedded
</script>

<template>
  <suspense>
    <div id="container">
      <Builder
        v-if="!embedded"
        :id="id"
      />
      <Renderer :id="id" />
    </div>
  </suspense>
</template>

<style scoped>
  #container {
    display: flex;
  }

  #container > div {
    flex-grow: 1;
  }
</style>
