import { ref } from 'vue';

export interface PlaceDragState {
  placeId: string;
  fromDay: number;
  fromIndex: number;
}

export type PlaceDropPlacement = 'before' | 'after' | 'append';

export interface PlaceDropTarget {
  day: number;
  index: number;
  placement: PlaceDropPlacement;
}

const dragState = ref<PlaceDragState | null>(null);
const dropTarget = ref<PlaceDropTarget | null>(null);

export const usePlaceDragState = () => {
  const resetDragState = () => {
    dragState.value = null;
    dropTarget.value = null;
  };

  return {
    dragState,
    dropTarget,
    resetDragState,
  };
};
