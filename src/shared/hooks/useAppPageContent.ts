import { useMemo } from 'react';
import {
  getAppPageContent,
  resolveAppPageContent,
  type AppContentPage,
  type AppContentRole,
} from '@/shared/config/appPageContent';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPreviewState } from '@/shared/preview/appPreviewStore';
import { usePreferenceContext } from '@/shared/preferences';

export function useAppPageContent(role: AppContentRole, page: AppContentPage) {
  const { appSettings } = useAppData();
  const previewState = useAppPreviewState();
  const { tx } = usePreferenceContext();

  return useMemo(
    () => {
      const content = getAppPageContent(
        resolveAppPageContent(
          previewState.enabled && previewState.appPageContent
            ? previewState.appPageContent
            : appSettings?.appPageContent
        ),
        role,
        page
      );
      return Object.fromEntries(
        Object.entries(content).map(([key, value]) => [
          key,
          typeof value === 'string' && value.trim() ? tx(value) : value,
        ]),
      ) as typeof content;
    },
    [appSettings?.appPageContent, page, previewState.appPageContent, previewState.enabled, role, tx]
  );
}
