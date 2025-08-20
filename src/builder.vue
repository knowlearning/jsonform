<script setup>
import { ref, watch, onMounted, reactive } from 'vue'
import * as jsonpatch from 'fast-json-patch'

const props = defineProps({ id: String })

let formBuilderInstance

const builder = ref(null)
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
}

onMounted(async () => {
  formBuilderInstance = await $(builder.value).formBuilder({
    formData: JSON.parse(JSON.stringify(state.formData)),
    onAddFieldAfter: handleBuilderUpdate,
    onDeleteFieldAfter: handleBuilderUpdate,
    onCloseFieldEdit: handleBuilderUpdate,
    onClear: handleBuilderUpdate
  }).promise
})

</script>

<template>
  <div ref="builder" />
</template>

<style scoped>
</style>
