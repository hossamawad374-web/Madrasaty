/*
 * Madrasaty — AI Tutor Service
 * Streams educational chat responses from the ai-tutor Edge Function
 */

import { getSupabaseClient } from '@/template';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SubjectContext {
  subjectAr: string;
  subjectEn?: string;
  lessonTitle?: string;
}

export const aiTutorService = {
  /**
   * Send a message and stream the AI tutor response.
   * Calls onChunk with each text delta, onDone when complete.
   */
  async streamMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
    subjectContext: SubjectContext | null,
    onChunk: (chunk: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-tutor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ messages, subjectContext }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        onError(`فشل الاتصال بالمعلم الذكي. (${response.status})`);
        console.error('ai-tutor response error:', text);
        return;
      }

      let fullText = '';

      // Cross-platform streaming handler
      const reader = response.body?.getReader();

      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') {
              onDone(fullText);
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                fullText += delta;
                onChunk(delta);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } else {
        // Fallback: full response text
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // Skip
          }
        }
      }

      onDone(fullText);
    } catch (err) {
      console.error('aiTutorService error:', err);
      onError('حدث خطأ في الاتصال. تحقق من اتصالك بالإنترنت.');
    }
  },
};
