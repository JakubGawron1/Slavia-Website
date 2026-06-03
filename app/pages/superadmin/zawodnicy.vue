<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Zespół i konta — SuperAdmin',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <ClubTeamManagementHub area="superadmin" default-tab="players" />
</template>
