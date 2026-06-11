<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'

await useCmsPageHydrate('kontakt')

useProvideCmsPageData('kontakt', () => ({}))

useSeoMeta({
  title: 'Kontakt — Slavia Ruda Śląska',
  description:
    'Skontaktuj się z CKS Slavia Ruda Śląska — zapisy na treningi podnoszenia ciężarów, pytania o klub i współpracę. Odpowiadamy na wiadomości z formularza.',
  ogTitle: 'Kontakt — CKS Slavia',
  ogDescription: 'Napisz do klubu podnoszenia ciężarów z Rudy Śląskiej — treningi, zapisy i współpraca.',
  robots: 'index, follow'
})

const toast = useToast()

const mapsUrl = 'https://maps.app.goo.gl/zqGy466nizCv45c57'

const sending = ref(false)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
  website: ''
})

async function submit() {
  const name = form.name.trim()
  const email = form.email.trim()
  const message = form.message.trim()
  if (!name || !message || !email) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'warning' })
    return
  }
  if (!email.includes('@') || email.length < 5) {
    toast.add({ title: 'Podaj poprawny e-mail', color: 'warning' })
    return
  }
  sending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name,
        email,
        phone: form.phone.trim() || undefined,
        message,
        website: form.website
      }
    })
    toast.add({
      title: 'Wiadomość wysłana',
      description: 'Dziękujemy — odezwiemy się, gdy tylko będzie to możliwe.',
      color: 'success'
    })
    form.name = ''
    form.email = ''
    form.phone = ''
    form.message = ''
  } catch (e) {
    toast.add({
      title: 'Nie udało się wysłać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <PublicPageLayout padding="hero">
    <PublicPageHeader
      variant="hero"
      icon="i-lucide-mail"
    >
      <template #eyebrow>
        <CmsEditable
          page-name="kontakt"
          field-key="eyebrow"
          type="text"
          label="Odznaka"
          tag="span"
          fallback="CKS Slavia"
        />
      </template>
      <template #title>
        <CmsEditable
          page-name="kontakt"
          field-key="title"
          type="text"
          label="Tytuł"
          tag="span"
          fallback="Kontakt"
        />
      </template>
      <template #description>
        <CmsEditable
          page-name="kontakt"
          field-key="description"
          type="text"
          label="Opis nagłówka"
          tag="span"
          fallback="Cieszymy się, że chcesz napisać do nas. Niezależnie od tego, czy myślisz o pierwszych treningach na platformie, zapisach do kadry czy współpracy — zostaw wiadomość w formularzu, a administracja klubu odezwie się, gdy tylko będzie to możliwe."
        />
      </template>
    </PublicPageHeader>

    <div class="slavia-content-well slavia-public-grid slavia-public-grid--2 lg:items-start">
      <div
        v-slavia-reveal="'fade-up'"
        class="slavia-page-card space-y-6 border border-default/60 bg-card/80 p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 class="text-lg font-bold text-highlighted">
            O klubie
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            <CmsEditable
              page-name="kontakt"
              field-key="about_text"
              type="html"
              label="O klubie (bok)"
              tag="span"
              fallback="CKS Slavia to sekcja podnoszenia ciężarów z Rudy Śląskiej — trenujemy młodzież i dorosłych, od bezpiecznej nauki techniki po starty w zawodach. Jeśli nie wiesz, od czego zacząć, napisz kilka słów o sobie i swoich planach — chętnie podpowiemy, jak wyglądają zapisy i pierwsze spotkanie na sali."
            />
          </p>
        </div>

        <ul class="space-y-4 text-sm text-muted">
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-map-pin"
              class="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              Siedziba:
              <a
                :href="mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-highlighted underline-offset-2 hover:text-primary hover:underline"
              >
                ul. Konopnickiej 13, 41-700 Ruda Śląska
              </a>
            </span>
          </li>
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-calendar-clock"
              class="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              Treningi klubowe: poniedziałek, środa i piątek,
              <span class="font-medium text-highlighted">15:00–18:00</span>
              — szczegóły organizacyjne i wydarzenia są też w
              <NuxtLink
                to="/kalendarz"
                class="font-medium text-primary underline-offset-2 hover:underline"
              >
                kalendarzu
              </NuxtLink>.
            </span>
          </li>
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-message-square-text"
              class="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              Najszybciej dotrzesz do nas przez formularz obok — podaj e-mail, a w razie potrzeby numer telefonu do oddzwonienia.
            </span>
          </li>
        </ul>

        <UButton
          :href="mapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          color="neutral"
          icon="i-lucide-map"
          class="w-full justify-center sm:w-auto"
        >
          Otwórz w mapach
        </UButton>
      </div>

      <UCard
        v-slavia-reveal="'fade-up'"
        :data-slavia-reveal-delay="80"
        class="slavia-page-card h-full"
      >
        <template #header>
          <div class="px-1 pt-1">
            <h2 class="text-lg font-bold text-highlighted">
              Wyślij wiadomość
            </h2>
            <p class="mt-1 text-sm text-muted">
              Pola oznaczone jako wymagane muszą być uzupełnione. Treść trafia do skrzynki administracji klubu.
            </p>
          </div>
        </template>
        <form
          class="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6"
          @submit.prevent="submit"
        >
          <input
            v-model="form.website"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
            class="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
          >
          <UFormField
            label="Imię i nazwisko"
            required
          >
            <UInput
              v-model="form.name"
              autocomplete="name"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="E-mail"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              autocomplete="email"
              inputmode="email"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Telefon (opcjonalnie)">
            <UInput
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Wiadomość"
            required
          >
            <UTextarea
              v-model="form.message"
              placeholder="Np. wiek, doświadczenie sportowe, pytanie o zapisy lub współpracę…"
              class="min-h-32 w-full"
              autoresize
            />
          </UFormField>
          <UButton
            type="submit"
            block
            size="lg"
            class="min-h-12 justify-center"
            :loading="sending"
          >
            Wyślij
          </UButton>
        </form>
      </UCard>
    </div>

    <p class="mx-auto mt-8 max-w-6xl text-center text-xs text-muted">
      <CmsEditable
        page-name="kontakt"
        field-key="footer_note"
        type="text"
        label="Notka pod formularzem"
        tag="span"
        fallback="Wiadomości przegląda administracja klubu w panelu — zwykle odpowiadamy w ciągu kilku dni roboczych."
      />
    </p>
  </PublicPageLayout>
</template>
