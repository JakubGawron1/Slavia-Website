<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'

useSeoMeta({
  title: 'Kontakt — Slavia Ruda Śląska',
  description: 'Napisz do klubu — formularz wiadomości. Odpowiadamy po konsultacji z administracją.',
  robots: 'index, follow'
})

const config = useRuntimeConfig()
const toast = useToast()

const apiRoot = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const sending = ref(false)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: ''
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
    await $fetch(`${apiRoot.value}/api/contact`, {
      method: 'POST',
      body: {
        name,
        email,
        phone: form.phone.trim() || undefined,
        message
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
  <PublicPageLayout narrow>
    <PublicPageHeader
      eyebrow="CKS Slavia"
      title="Kontakt"
      description="Masz pytanie o treningi, zapisy lub współpracę? Zostaw wiadomość — administratorzy klubu zobaczą ją w panelu."
    />

    <div class="mx-auto max-w-xl">
      <UCard class="slavia-page-card mt-2">
        <form
          class="flex flex-col gap-4 p-4 sm:p-6"
          @submit.prevent="submit"
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

      <p class="mt-6 text-center text-xs text-muted">
        Administracja może przeglądać i oznaczać wiadomości w panelu administratora.
      </p>
    </div>
  </PublicPageLayout>
</template>
