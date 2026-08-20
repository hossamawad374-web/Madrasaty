/*
 * Madrasaty — AI Tutor Tab Screen (المعلم الذكي)
 * Premium educational chat interface with streaming AI responses
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAITutor } from '@/hooks/useAITutor';
import { ChatMessage } from '@/services/aiTutorService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ── Quick question chips ─────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  'اشرح لي هذا الدرس',
  'أعطني مثالاً عملياً',
  'ما أهمية هذا الموضوع؟',
  'اختبرني بسؤال',
  'لخّص النقاط الأساسية',
];

export default function TutorScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isStreaming, streamingContent, sendMessage, clearChat } = useAITutor(null);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingContent]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, isStreaming, sendMessage]);

  const handleQuickQuestion = useCallback(
    (q: string) => {
      if (isStreaming) return;
      sendMessage(q);
    },
    [isStreaming, sendMessage]
  );

  // Build display messages including streaming bubble
  const displayMessages = streamingContent
    ? [...messages, { id: 'streaming', role: 'assistant' as const, content: streamingContent, timestamp: new Date() }]
    : messages;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDarker, Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={clearChat}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <MaterialIcons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.aiAvatarHeader}>
              <MaterialIcons name="psychology" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>المعلم الذكي</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>متاح الآن</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<QuickQuestionsBar onSelect={handleQuickQuestion} disabled={isStreaming} />}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isStreaming={item.id === 'streaming'}
            />
          )}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
          ]}
        >
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="اسأل معلمك عن أي شيء..."
            placeholderTextColor={Colors.textHint}
            multiline
            maxLength={500}
            textAlign="right"
            writingDirection="rtl"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isStreaming}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming}
            style={({ pressed }) => [
              styles.sendBtn,
              (!inputText.trim() || isStreaming) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="إرسال"
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Quick Questions Bar ───────────────────────────────────────────────────────

function QuickQuestionsBar({
  onSelect,
  disabled,
}: {
  onSelect: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.quickBar}>
      <Text style={styles.quickLabel}>أسئلة سريعة:</Text>
      <View style={styles.quickChips}>
        {QUICK_QUESTIONS.map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => onSelect(q)}
            disabled={disabled}
            style={[styles.quickChip, disabled && styles.quickChipDisabled]}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) {
  const isUser = message.role === 'user';
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isStreaming) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [isStreaming]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  const time = message.timestamp.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {/* AI avatar */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="psychology" size={18} color={Colors.primary} />
        </View>
      )}

      <View style={[styles.bubbleMax, isUser ? styles.bubbleMaxUser : styles.bubbleMaxAI]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
            isStreaming && styles.bubbleStreaming,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
            ]}
            selectable
          >
            {message.content}
          </Text>

          {/* Streaming indicator */}
          {isStreaming && (
            <Animated.View style={[styles.streamingDot, dotStyle]}>
              <View style={styles.streamingDotInner} />
            </Animated.View>
          )}
        </View>

        {/* Timestamp */}
        <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAI]}>
          {time}
        </Text>
      </View>

      {/* User avatar */}
      {isUser && (
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={18} color={Colors.textOnPrimary} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiAvatarHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#69F0AE',
  },
  onlineText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    includeFontPadding: false,
  },

  // Messages
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },

  // Quick questions
  quickBar: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  quickLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'flex-end',
  },
  quickChip: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
  },
  quickChipDisabled: { opacity: 0.5 },
  quickChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },

  // Bubble row
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bubbleRowUser: { justifyContent: 'flex-start' },
  bubbleRowAI: { justifyContent: 'flex-end' },

  bubbleMax: { maxWidth: width * 0.76 },
  bubbleMaxUser: { alignItems: 'flex-start' },
  bubbleMaxAI: { alignItems: 'flex-end' },

  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }) as object),
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomRightRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleStreaming: {
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
  },
  bubbleText: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.7,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  bubbleTextAI: {
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  // Streaming cursor dot
  streamingDot: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  streamingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Time
  timeText: {
    fontSize: FontSize.xs - 1,
    color: Colors.textHint,
    marginTop: 3,
    includeFontPadding: false,
  },
  timeTextUser: { textAlign: 'left' },
  timeTextAI: { textAlign: 'right' },

  // Avatars
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
    ...(Platform.select({
      ios: {
        shadowColor: '#3F51B5',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }) as object),
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }) as object),
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textHint,
  },
  sendBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
