<template>
  <div class="min-h-screen bg-[#f7f6f3] text-slate-950">
    <LandingHeader />

    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCta />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import LandingCta from '~/components/landing/LandingCta.vue';
import LandingFeatures from '~/components/landing/LandingFeatures.vue';
import LandingFooter from '~/components/landing/LandingFooter.vue';
import LandingHeader from '~/components/landing/LandingHeader.vue';
import LandingHero from '~/components/landing/LandingHero.vue';
import LandingHowItWorks from '~/components/landing/LandingHowItWorks.vue';

const pageTitle = 'Попутно — планировщик городских маршрутов';
const pageDescription = 'Планируйте городские путешествия, добавляйте места, распределяйте маршрут по дням и делитесь поездкой с друзьями в Попутно.';

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
});
</script>
