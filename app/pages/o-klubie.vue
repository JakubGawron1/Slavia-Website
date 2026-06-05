<script setup lang="ts">
await useCmsPageHydrate('o-klubie')

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
      icon="i-lucide-landmark"
    >
      <template #eyebrow>
        <CmsEditable
          page-name="o-klubie"
          field-key="eyebrow"
          type="text"
          label="Odznaka"
          tag="span"
          fallback="CKS Slavia"
        />
      </template>
      <template #title>
        <CmsEditable
          page-name="o-klubie"
          field-key="title"
          type="text"
          label="Tytuł"
          tag="span"
          fallback="O klubie"
        />
      </template>
      <template #description>
        <CmsEditable
          page-name="o-klubie"
          field-key="description"
          type="text"
          label="Opis"
          tag="span"
          fallback="Tradycja, ludzie i codzienna praca na platformie — oś czasu najważniejszych momentów w historii naszej sekcji."
        />
      </template>
    </PublicPageHeader>

    <ClubHistoryTimeline heading-id="o-klubie-history-heading" />

    <div class="slavia-page-card mx-auto mt-12 flex max-w-3xl flex-col items-center gap-5 px-6 py-10 text-center sm:mt-16 sm:px-10 sm:py-12">
      <p class="text-sm leading-relaxed text-muted sm:text-base">
        <CmsEditable
          page-name="o-klubie"
          field-key="cta_text"
          type="text"
          label="Tekst CTA"
          tag="span"
          fallback="Chcesz dołączyć do kadry lub współpracować z klubem? Napisz — chętnie opowiemy więcej o treningach i zapisach."
        />
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
