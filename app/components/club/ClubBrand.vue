<template>
  <NuxtLink
    to="/"
    class="flex min-w-0 shrink-0 items-center gap-1.5 rounded-lg outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary sm:gap-2 lg:gap-2 xl:gap-3"
  >
    <img
      src="/logo.png"
      alt="CKS Slavia Logo"
      class="h-8 w-auto sm:h-9 lg:h-9 xl:h-10"
    >
    <div class="min-w-0 flex flex-col leading-tight">
      <span class="truncate text-xs font-bold uppercase tracking-tight text-highlighted sm:text-sm lg:text-[13px] xl:text-sm">Slavia</span>
      <span class="hidden truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-muted xl:block xl:text-[10px] xl:tracking-[0.2em]">Ruda Śląska</span>
    </div>
  </NuxtLink>
</template>
