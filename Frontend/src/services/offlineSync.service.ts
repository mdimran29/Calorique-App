// services/offlineSync.service.ts — Flush offline mutation queue when back online

import { type QueryClient } from '@tanstack/react-query';
import { useMealStore } from '../store/mealStore';
import { mealsApi } from '../api/meals.api';
import { notificationService } from './notification.service';
import type { CreateMealPayload } from '../types/meal.types';

/**
 * Attempt to flush the offline queue by replaying queued mutations.
 * Should be called when the device comes back online.
 */
export async function flushOfflineQueue(queryClient: QueryClient): Promise<void> {
  const { offlineQueue, removeFromOfflineQueue } = useMealStore.getState();

  if (offlineQueue.length === 0) return;

  notificationService.info(`Syncing ${offlineQueue.length} offline action(s)…`);

  const results = await Promise.allSettled(
    offlineQueue.map(async (item) => {
      try {
        if (item.type === 'create') {
          await mealsApi.createMeal(item.payload as CreateMealPayload);
        }
        // extend for 'update' / 'delete' as needed
        removeFromOfflineQueue(item.id);
      } catch (err) {
        console.error('[OfflineSync] Failed to replay mutation', item.id, err);
        throw err;
      }
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;

  if (succeeded > 0) {
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    notificationService.success(`${succeeded} item(s) synced successfully.`);
  }
  if (failed > 0) {
    notificationService.error(`${failed} item(s) failed to sync. Will retry later.`);
  }
}
