<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** Use v-model to show/hide */
  modelValue: { type: Boolean, default: false },
  /** Optional message under the spinner */
  message: { type: String, default: 'Loading…' },
  /** Render as full-screen overlay */
  fullscreen: { type: Boolean, default: true },
  /** Backdrop color (can include alpha) */
  backdrop: { type: String, default: 'rgba(0,0,0,0.35)' },
  /** Apply a subtle blur to content behind */
  blur: { type: Boolean, default: true },
  /** z-index for the overlay */
  zIndex: { type: [Number, String], default: 9999 },
  /** Teleport to <body> when fullscreen */
  teleport: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed(() => props.modelValue)

// prevent background scroll when fullscreen + visible
const lockScroll = () => {
  if (!props.fullscreen) return
  const original = document.body.style.overflow
  document.body.dataset._overlayOverflow = original
  document.body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  if (!props.fullscreen) return
  const original = document.body.dataset._overlayOverflow || ''
  document.body.style.overflow = original
  delete document.body.dataset._overlayOverflow
}

watch(() => props.modelValue, v => {
  if (v) lockScroll()
  else unlockScroll()
}, { immediate: true })

onMounted(() => {
  if (props.modelValue) lockScroll()
})

onBeforeUnmount(() => {
  unlockScroll()
})
</script>

<template>
  <Teleport v-if="fullscreen && teleport" to="body">
    <transition name="overlay-fade" appear>
      <div
        v-if="visible"
        class="voverlay"
        :style="{ '--vo-backdrop': backdrop, '--vo-z': zIndex }"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="vo-card" :class="{ 'vo-blur': blur }">
          <div class="vo-spinner" aria-hidden="true" />
          <div v-if="message || $slots.default" class="vo-message">
            <slot>{{ message }}</slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- Non-fullscreen mode renders in-place without teleport -->
  <transition name="overlay-fade" appear>
    <div
      v-if="!fullscreen"
      v-show="visible"
      class="voverlay vo-inline"
      :style="{ '--vo-backdrop': backdrop, '--vo-z': zIndex }"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="vo-card" :class="{ 'vo-blur': blur }">
        <div class="vo-spinner" aria-hidden="true" />
        <div v-if="message || $slots.default" class="vo-message">
          <slot>{{ message }}</slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.voverlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--vo-backdrop);
  z-index: var(--vo-z);
  pointer-events: all;
}

/* Inline (non-fullscreen) mode */
.vo-inline {
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.vo-card {
  min-width: 160px;
  max-width: min(90vw, 420px);
  padding: 20px 24px;
  border-radius: 14px;
  background: rgba(20, 20, 20, 0.85);
  color: #fff;
  display: grid;
  justify-items: center;
  gap: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
}

.vo-blur {
  backdrop-filter: blur(4px) saturate(120%);
}

.vo-spinner {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 3px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  animation: vo-spin 0.9s linear infinite;
}

.vo-message {
  font-weight: 600;
  letter-spacing: 0.2px;
  text-align: center;
}

@keyframes vo-spin { to { transform: rotate(360deg) } }

/* Fade transition */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to { opacity: 0; transform: scale(0.98) }
</style>

<!--
USAGE EXAMPLES

Full-screen (default):

<LoadingOverlay v-model="loading" message="Fetching data" />

Inline overlay inside a relatively-positioned container:

<div style="position: relative">
  <YourPanel />
  <LoadingOverlay v-model="panelBusy" :fullscreen="false" />
</div>

Custom message via slot:

<LoadingOverlay v-model="loading">
  Please wait while frogs vectorize…
</LoadingOverlay>

Props:
- v-model (Boolean): show/hide
- message (String): optional text under spinner
- fullscreen (Boolean): full-screen vs inline in parent
- backdrop (String): CSS color for backdrop
- blur (Boolean): blur background content
- zIndex (Number|String): stacking context value
- teleport (Boolean): teleport to body when fullscreen
-->
