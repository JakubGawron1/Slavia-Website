<template>
  <div class="animate-page-in relative min-w-0 overflow-x-clip">
    <div
      class="pointer-events-none absolute -left-20 top-24 size-[280px] rounded-full bg-primary/8 blur-3xl dark:bg-primary/15"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-16 top-[42vh] size-[240px] rounded-full bg-muted blur-3xl opacity-70"
      aria-hidden="true"
    />
    <UPageHero
      class="relative overflow-hidden max-md:pb-4"
      :ui="{
        container: 'lg:gap-12 xl:gap-16',
        title: 'text-pretty max-w-3xl text-center mx-auto text-3xl leading-tight sm:text-4xl lg:text-5xl xl:text-6xl xl:max-w-4xl',
        description: 'text-pretty max-w-2xl text-center mx-auto text-base text-muted sm:text-lg lg:text-xl lg:max-w-3xl lg:leading-relaxed',
        links: 'flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:gap-4 justify-center'
      }"
    >
      <template #title>
        CKS Slavia Ruda Śląska
      </template>
      <template #description>
        Klub podnoszenia ciężarów z tradycją i pasją. Trenujemy młodzież i dorosłych — od pierwszych kroków na platformie po starty w zawodach ogólnopolskich.
      </template>
      <template #links>
        <UButton
          to="/zawodnicy"
          size="xl"
          trailing-icon="i-lucide-arrow-right"
          class="min-h-12 w-full justify-center sm:w-auto sm:min-h-0"
        >
          Poznaj zawodników
        </UButton>
        <UButton
          to="/kalkulator-sinclair"
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-calculator"
          class="min-h-12 w-full justify-center sm:w-auto sm:min-h-0"
        >
          Kalkulator Sinclair
        </UButton>
        <UButton
          to="/logowanie"
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-lucide-shield"
          class="min-h-12 w-full justify-center sm:w-auto sm:min-h-0"
        >
          Strefa klubu
        </UButton>
      </template>
    </UPageHero>

    <UPageSection
      title="Kim jesteśmy"
      description="Slavia to nie tylko medalowe nazwiska — przede wszystkim ludzie, codzienna praca i bezpieczna nauka techniki."
      :features="[
        {
          icon: 'i-lucide-users',
          title: 'Społeczność',
          description: 'Trenerzy i zawodnicy tworzą przyjazną atmosferę — tu każdy zaczyna od solidnych podstaw.'
        },
        {
          icon: 'i-lucide-medal',
          title: 'Sport i rozwój',
          description: 'Starty w zawodach, progres na platformie i cele dopasowane do wieku oraz poziomu zaawansowania.'
        },
        {
          icon: 'i-lucide-heart-pulse',
          title: 'Zdrowy trening',
          description: 'Nacisk na technikę, regenerację i długofalowe bezpieczeństwo — siła ma służyć latami.'
        }
      ]"
    />

    <UPageSection
      orientation="horizontal"
      class="pb-12 lg:pb-20"
      :features="[
        {
          icon: 'i-lucide-map-pin',
          title: 'Gdzie jesteśmy?',
          description: 'CKS Slavia Ruda Śląska, ul. Konopnickiej 13, 41-700 Ruda Śląska. Zapraszamy do wspólnych treningów na profesjonalnej sali.'
        },
        {
          icon: 'i-lucide-calendar-days',
          title: 'Godziny treningów',
          description: 'Treningi odbywają się w poniedziałki, środy i piątki w godzinach 15:00 - 18:00 pod okiem wykwalifikowanej kadry trenerskiej.'
        },
        {
          icon: 'i-lucide-phone',
          title: 'Kontakt',
          description: 'Masz pytania? Skontaktuj się z nami bezpośrednio w godzinach treningów lub poprzez nasze media społecznościowe na Facebooku.'
        }
      ]"
    />

    <UPageSection>
      <UPageCTA
        title="Zobacz naszą drużynę"
        description="Aktualna lista zawodników i ich osiągnięcia w jednym, przejrzystym widoku."
        variant="subtle"
        :links="[
          {
            label: 'Lista zawodników',
            to: '/zawodnicy',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'primary'
          }
        ]"
      />
    </UPageSection>
  </div>
</template>
