<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Zespół i konta — Panel admina',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <ClubTeamManagementHub area="admin" default-tab="players" />
</template>
