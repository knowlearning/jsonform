<script setup>
  import { ref, watch, onMounted, reactive } from 'vue'
  import * as jsonpatch from 'fast-json-patch'

  const props = defineProps({ id: String })

  let rendererInstance
  const renderer = ref(null)
  const runstate = await Agent.state(`runstate/${props.id}`)

  if (!runstate.submissions) runstate.submissions = []

  Agent
    .watch(props.id, ({ state }) => {
      $(renderer.value).formRender({ formData: JSON.parse(JSON.stringify(state.formData)) })
    })

  onMounted(async () => {
    rendererInstance = $(renderer.value).formRender({ formData: await Agent.state(props.id).then(s => s.formData) })
  })

  function updateRunstate() {
    if (rendererInstance) {
      const newUserFormSubmissions = rendererInstance.userData
      const patches = jsonpatch.compare(runstate.submissions, newUserFormSubmissions)
      if (patches.length > 0) {
        jsonpatch.applyPatch(runstate.submissions, patches)
      }
      console.log(JSON.stringify(runstate, null, 4))
    }
  }

</script>

<template>
  <div>
    <div ref="renderer" />
    <div>
      <button @click="updateRunstate">Submit</button>
    </div>
  </div>
</template>

<style scoped>
</style>
