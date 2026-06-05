<script setup lang="ts">
/** USelect w overlayach (SlaviaEditorSheet / SlaviaModal) — lokalny portal ponad overflow. */
const portalTarget = useOverlaySelectPortal()
</script>

<template>
  <USelect
    v-bind="$attrs"
    :portal="portalTarget"
  />
</template>
