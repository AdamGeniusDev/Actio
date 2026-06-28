import { useMutation } from '@tanstack/react-query';

import { aiApi } from '@/lib/api/aiApi';

export function useParseTaskFromTextMutation() {
  return useMutation({ mutationFn: aiApi.parseTaskFromText });
}

export function useParseTaskFromAudioMutation() {
  return useMutation({
    mutationFn: ({ audioBase64, format }: { audioBase64: string; format: string }) =>
      aiApi.parseTaskFromAudio(audioBase64, format),
  });
}
