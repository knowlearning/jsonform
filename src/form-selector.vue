<script setup>
import { reactive, onMounted } from 'vue'

const props = defineProps({
  forms: {
    type: Object,
    required: true
  },
  activeId: {
    type: String,
    default: null
  }
})
const emit = defineEmits(['update'])

// intial map, id=>id instead of id=>name, before formIdsToNames load
const initialMap = Object.keys(props.forms)
  .reduce((acc, id) => {
      acc[id] = id
      return acc
    }, {})
const formIdsToNames = reactive(initialMap)

onMounted(async () => {
  const ids = Object.keys(props.forms)
  const myPromiseArray = ids.map(id => Agent.state(id))
  const formStates = await Promise.all(myPromiseArray)

  formStates.forEach((st, i) => {
    const id = ids[i]
    formIdsToNames[id] = st?.name || id
  })
})
</script>

<template>
  <div>
    <select
      :value="activeId"
      @change="emit('update', $event.target.value)"
      style="width: 200px;"
    >
      <option disabled value="">Select one of your forms...</option>
      <option
        v-for="(name, id) in formIdsToNames"
        :key="id"
        :value="id"
      >
        {{ `${id} :: ${name}` }}
      </option>
    </select>
  </div>
</template>
