<script setup lang="ts">
useSeoMeta({
  title: 'O klubie — historia CKS Slavia Ruda Śląska',
  description:
    'Poznaj historię CKS Slavia Ruda Śląska — od założenia sekcji podnoszenia ciężarów po dzisiejsze sukcesy na sali przy ul. Konopnickiej.',
  ogTitle: 'O klubie — CKS Slavia',
  ogDescription: 'Kamienie milowe i tradycja klubu podnoszenia ciężarów z Rudy Śląskiej.',
  robots: 'index, follow'
})
</script>

<template>
  <PublicPageLayout padding="hero">
    <PublicPageHeader
      variant="hero"
      eyebrow="CKS Slavia"
      icon="i-lucide-landmark"
      title="O klubie"
      description="Tradycja, ludzie i codzienna praca na platformie — oś czasu najważniejszych momentów w historii naszej sekcji."
    />

    <ClubHistoryTimeline heading-id="o-klubie-history-heading" />

    <div class="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-4 text-center sm:mt-16">
      <p class="text-sm leading-relaxed text-muted">
        Chcesz dołączyć do kadry lub współpracować z klubem? Napisz — chętnie opowiemy więcej o treningach i zapisach.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <UButton
          to="/kontakt"
          size="lg"
          icon="i-lucide-mail"
          class="font-bold"
        >
          Kontakt
        </UButton>
        <UButton
          to="/"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-home"
          class="font-bold"
        >
          Strona główna
        </UButton>
      </div>
    </div>
  </PublicPageLayout>
</template>
