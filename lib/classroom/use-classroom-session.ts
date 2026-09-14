'use client';

import { useEffect } from 'react';
import { useMediaGenerationStore } from '@/lib/store/media-generation';
import { useWhiteboardHistoryStore } from '@/lib/store/whiteboard-history';
import { useCanvasStore } from '@/lib/store/canvas';
import { clearNarrationAllocations } from '@/lib/audio/narration-allocations';
import { clearPendingMediaAllocations } from '@/lib/media/pending-media-allocations';
import { noteStageGenerationOwnership } from '@/lib/classroom/generation-permission';

/** Shared per-course reset performed whenever either classroom surface changes course. */
export function useClassroomSession(classroomId: string): void {
  useEffect(() => {
    noteStageGenerationOwnership(classroomId, 'unresolved');
    const mediaStore = useMediaGenerationStore.getState();
    mediaStore.revokeObjectUrls();
    useMediaGenerationStore.setState({ tasks: {} });
    clearPendingMediaAllocations(classroomId);
    clearNarrationAllocations(classroomId);
    useWhiteboardHistoryStore.getState().clearHistory();
    useCanvasStore.getState().resetCanvasState();
  }, [classroomId]);
}
