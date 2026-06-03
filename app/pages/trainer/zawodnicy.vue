<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Zespół i konta — Panel trenera',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <ClubTeamManagementHub area="trainer" default-tab="players" />
</template>
