<script setup>
import { ref, onMounted } from 'vue'
import * as jsonpatch from 'fast-json-patch'

const props = defineProps({ id: String })

let formBuilderInstance

const builder = ref(null)
const unsaved = ref(false)
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

</script>

<template>
  <div class="wrapper">
    <div class="unsaved-warning">
      <span v-show="unsaved">Your form has unsaved changes</span>
    </div>
    <div ref="builder" />
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}
.unsaved-warning {
  height: 30px;
  color: red;
}
</style>
