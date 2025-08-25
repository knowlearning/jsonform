<script setup>
  import { ref, watch, onMounted, reactive } from 'vue'
  import * as jsonpatch from 'fast-json-patch'

  const copy = x => JSON.parse(JSON.stringify(x))

  const props = defineProps({ id: String })

  let rendererInstance
  const renderer = ref(null)
  const runstate = await Agent.state(`runstate/${props.id}`)

  if (!runstate.submissions) runstate.submissions = {}

  onMounted(async () => {
    const formData = copy(await Agent.state(props.id).then(s => s.formData))
    formData
      .forEach(d => {
        if (runstate.submissions[d.name]) {
          d.userData = copy(runstate.submissions[d.name])
        }
      })
    rendererInstance = (
      $(renderer.value)
        .formRender({ formData })
    )
  })

  function updateRunstate() {
    if (rendererInstance) {
      console.log('saving...', rendererInstance.userData)
      const currentSubmissions = (
        rendererInstance
          .userData
          .reduce((acc, cur) => {
            if (cur.userData) acc[cur.name] = cur.userData
            return acc
          }, {})
      )
      Object
        .entries(currentSubmissions)
        .forEach(([name, userData]) => {
          runstate.submissions[name] = userData
        })
      console.log(JSON.stringify(runstate, null, 4))
    }
  }

</script>

<template>
  <div class="render-wrapper">
    <div ref="renderer" />
    <div>
      <button @click="updateRunstate">Next</button>
    </div>
  </div>
</template>

<style scoped>

.render-wrapper {
  max-width: 540px;
  margin: 0 auto;
  padding: 1rem;
}

</style>
