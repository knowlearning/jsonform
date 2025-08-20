<script setup>
import { ref, watch, onMounted, reactive } from 'vue'

const props = defineProps({ id: String })

const renderer = ref(null)

Agent
  .watch(props.id, ({ state }) => {
    $(renderer.value).formRender({ formData: state.formData })
  })

onMounted(async () => {
  $(renderer.value).formRender({ formData: await Agent.state(props.id).then(s => s.formData) })
})

</script>

<template>
  <div ref="renderer" />
</template>

<style scoped>
</style>
