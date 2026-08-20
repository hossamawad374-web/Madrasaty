/*
 * Madrasaty — useAITutor Hook
 * Manages chat state for the AI educational tutor
 */

import { useState, useCallback, useRef } from 'react';
import { aiTutorService, ChatMessage, SubjectContext } from '@/services/aiTutorService';

let messageIdCounter = 0;
function nextId() {
  return `msg_${Date.now()}_${messageIdCounter++}`;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'مرحباً بك في مدرستي! 👋\n\nأنا معلمك الذكي، هنا لمساعدتك في فهم دروسك وشرح المفاهيم الصعبة.\n\nيمكنك سؤالي عن أي شيء في مادتك، وسأشرح لك خطوة بخطوة بأسلوب بسيط ومشوّق! 📚✨\n\nما الذي تريد أن تتعلمه اليوم؟',
  timestamp: new Date(),
};

export function useAITutor(subjectContext: SubjectContext | null = null) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent('');
      abortRef.current = false;

      // Build history for API (exclude welcome, keep last 18)
      const history = [...messages.filter((m) => m.id !== 'welcome'), userMsg]
        .slice(-18)
        .map(({ role, content }) => ({ role, content }));

      let accumulated = '';

      await aiTutorService.streamMessage(
        history,
        subjectContext,
        (chunk) => {
          if (abortRef.current) return;
          accumulated += chunk;
          setStreamingContent(accumulated);
        },
        (fullText) => {
          if (abortRef.current) return;
          const assistantMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: fullText || accumulated,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');
          setIsStreaming(false);
        },
        (error) => {
          const errMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: `⚠️ ${error}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errMsg]);
          setStreamingContent('');
          setIsStreaming(false);
        }
      );
    },
    [messages, isStreaming, subjectContext]
  );

  const clearChat = useCallback(() => {
    abortRef.current = true;
    setMessages([WELCOME_MESSAGE]);
    setStreamingContent('');
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    clearChat,
  };
}
