<template>
  <section class="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-slate-950">
          День {{ day }}
        </h3>
        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          {{ placesLabel }}
        </p>
      </div>

      <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        {{ durationLabel }}
      </span>
    </div>

    <div
      v-if="places.length === 0"
      class="mt-4 rounded-2xl border border-dashed px-4 py-4 text-sm transition"
      :class="emptyDropZoneClass"
      @dragover.prevent="handleEmptyDayDragOver"
      @drop.prevent="handleEmptyDayDrop"
    >
      {{ emptyStateText }}
    </div>

    <div
      v-else
      ref="listRef"
      class="mt-4 space-y-3"
      @dragover.prevent="handleListDragOver"
      @drop.prevent="handleListDrop"
    >
      <div
        v-for="(place, index) in places"
        :key="place.uuid"
        :data-place-index="index"
      >
        <div
          v-if="isDropIndicatorVisible(index, 'before')"
          class="mb-3 h-3 rounded-full bg-blue-100 ring-1 ring-blue-200"
        />

        <article
          :draggable="!isMutating"
          class="group rounded-2xl border px-4 py-4 text-left transition"
          :class="cardClass(place)"
          @click="emit('select-place', place.uuid)"
          @dragstart="handleDragStart(place, index, $event)"
          @dragend="handleDragEnd"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-start gap-3">
                <span
                  class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition group-hover:text-blue-600"
                  :class="isMutating ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'"
                  aria-hidden="true"
                >
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 5.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 5.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8-11.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 5.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 5.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor" />
                  </svg>
                </span>

                <div class="min-w-0 flex-1">
                  <p class="break-words text-sm font-semibold text-slate-950">
                    {{ place.name }}
                  </p>

                  <p class="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
                    {{ categoryLabels[place.category] }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                {{ orderLabel(index) }}
              </span>

              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isMutating"
                :aria-label="`Удалить место ${place.name}`"
                @click.stop="emit('delete-place', place.uuid)"
              >
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5.75 6.5h8.5m-7.5 0v7m3.25-7v7m3.25-7v7M8 3.75h4l.5 1.5h3a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1 0-1.5h3L8 3.75Zm-1 3h6.5v8.25a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6.75Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span class="rounded-full bg-white px-2.5 py-1">
              {{ formatDuration(place.duration_minutes) }}
            </span>

            <span
              v-if="place.visited"
              class="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
            >
              Посещено
            </span>
          </div>

          <p v-if="place.address" class="mt-3 break-words text-sm leading-5 text-slate-500">
            {{ place.address }}
          </p>
        </article>

        <div
          v-if="isDropIndicatorVisible(index, 'after')"
          class="mt-3 h-3 rounded-full bg-blue-100 ring-1 ring-blue-200"
        />
      </div>

      <div
        class="rounded-2xl border border-dashed px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] transition"
        :class="appendDropZoneClass"
      >
        Перетащите место сюда, чтобы поставить в конец дня
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  usePlaceDragState,
  type PlaceDropPlacement,
} from '~/composables/usePlaceDragState';
import type { Place, PlaceCategory } from '~/types/place';

interface Props {
  day: number;
  places: Place[];
  selectedPlaceId: string | null;
  isMutating?: boolean;
}

interface MovePlacePayload {
  placeId: string;
  day: number;
  order: number;
}

const emit = defineEmits<{
  (event: 'select-place', placeId: string): void;
  (event: 'delete-place', placeId: string): void;
  (event: 'move-place', payload: MovePlacePayload): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  isMutating: false,
});

const categoryLabels: Record<PlaceCategory, string> = {
  attraction: 'Достопримечательность',
  museum: 'Музей',
  cafe: 'Кафе',
  restaurant: 'Ресторан',
  park: 'Парк',
  viewpoint: 'Смотровая',
  shopping: 'Шопинг',
  other: 'Другое',
};

const listRef = ref<HTMLElement | null>(null);
const { dragState, dropTarget, resetDragState } = usePlaceDragState();

const placesLabel = computed(() => {
  const count = props.places.length;

  if (count === 0) {
    return 'Пустой день';
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} место`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} места`;
  }

  return `${count} мест`;
});

const durationLabel = computed(() => {
  const totalMinutes = props.places.reduce((sum, place) => sum + place.duration_minutes, 0);

  if (!totalMinutes) {
    return 'Без тайминга';
  }

  return formatDuration(totalMinutes);
});

const emptyStateText = computed(() => (
  dragState.value
    ? 'Перетащите место сюда, чтобы перенести его в этот день.'
    : 'Этот день пока пуст. Здесь появятся места, когда они будут добавлены в маршрут.'
));

const emptyDropZoneClass = computed(() => (
  isDropIndicatorVisible(0, 'append')
    ? 'border-blue-300 bg-blue-50 text-blue-700'
    : 'border-slate-200 bg-slate-50 text-slate-500'
));

const appendDropZoneClass = computed(() => (
  isDropIndicatorVisible(props.places.length, 'append')
    ? 'border-blue-300 bg-blue-50 text-blue-700'
    : 'border-slate-200 bg-slate-50 text-slate-400'
));

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
};

const orderLabel = (index: number) => `#${index + 1}`;

const cardClass = (place: Place) => {
  if (dragState.value?.placeId === place.uuid) {
    return 'border-blue-300 bg-blue-50/70 opacity-70 shadow-[0_12px_28px_rgba(37,99,235,0.12)]';
  }

  if (props.selectedPlaceId === place.uuid) {
    return 'border-blue-300 bg-blue-50 shadow-[0_12px_28px_rgba(37,99,235,0.12)]';
  }

  return 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50';
};

const isDropIndicatorVisible = (index: number, placement: PlaceDropPlacement) => (
  dropTarget.value?.day === props.day
  && dropTarget.value.index === index
  && dropTarget.value.placement === placement
);

const resolveTargetOrder = (targetDay: number, targetIndex: number, placement: PlaceDropPlacement) => {
  if (!dragState.value) {
    return null;
  }

  let targetOrder = placement === 'before'
    ? targetIndex
    : placement === 'after'
      ? targetIndex + 1
      : targetIndex;

  if (dragState.value.fromDay === targetDay && dragState.value.fromIndex < targetOrder) {
    targetOrder -= 1;
  }

  return Math.max(targetOrder, 0);
};

const emitMovePlace = (targetDay: number, targetIndex: number, placement: PlaceDropPlacement) => {
  if (!dragState.value || props.isMutating) {
    resetDragState();
    return;
  }

  const nextOrder = resolveTargetOrder(targetDay, targetIndex, placement);

  if (nextOrder === null) {
    resetDragState();
    return;
  }

  if (dragState.value.fromDay === targetDay && dragState.value.fromIndex === nextOrder) {
    resetDragState();
    return;
  }

  emit('move-place', {
    placeId: dragState.value.placeId,
    day: targetDay,
    order: nextOrder,
  });

  resetDragState();
};

const resolveDropTargetFromPointer = (clientY: number) => {
  const cardWrappers = Array.from(
    listRef.value?.querySelectorAll<HTMLElement>('[data-place-index]') ?? [],
  );

  if (!cardWrappers.length) {
    return {
      day: props.day,
      index: 0,
      placement: 'append' as const,
    };
  }

  for (const wrapper of cardWrappers) {
    const index = Number(wrapper.dataset.placeIndex);

    if (!Number.isFinite(index)) {
      continue;
    }

    const bounds = wrapper.getBoundingClientRect();
    const middleY = bounds.top + bounds.height / 2;

    if (clientY < middleY) {
      return {
        day: props.day,
        index,
        placement: 'before' as const,
      };
    }

    if (clientY <= bounds.bottom) {
      return {
        day: props.day,
        index,
        placement: 'after' as const,
      };
    }
  }

  return {
    day: props.day,
    index: props.places.length,
    placement: 'append' as const,
  };
};

const handleDragStart = (place: Place, index: number, event: DragEvent) => {
  if (props.isMutating) {
    event.preventDefault();
    return;
  }

  dragState.value = {
    placeId: place.uuid,
    fromDay: place.day,
    fromIndex: index,
  };

  dropTarget.value = null;
  event.dataTransfer?.setData('text/plain', place.uuid);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragEnd = () => {
  resetDragState();
};

const handleListDragOver = (event: DragEvent) => {
  if (!dragState.value || props.isMutating) {
    return;
  }

  dropTarget.value = resolveDropTargetFromPointer(event.clientY);

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleListDrop = (event: DragEvent) => {
  if (!dragState.value) {
    return;
  }

  const target = dropTarget.value ?? resolveDropTargetFromPointer(event.clientY);
  emitMovePlace(target.day, target.index, target.placement);
};

const handleEmptyDayDragOver = (event: DragEvent) => {
  if (!dragState.value || props.isMutating) {
    return;
  }

  dropTarget.value = {
    day: props.day,
    index: 0,
    placement: 'append',
  };

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleEmptyDayDrop = () => {
  if (!dragState.value) {
    return;
  }

  emitMovePlace(props.day, 0, 'append');
};
</script>
