/*
 * Madrasaty — Cinematic Lesson Screen (شاشة الدرس السينمائي)
 * World-class lesson view: custom video player, tabbed content, quiz, AI bridge
 * Route: /lesson/[id]
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
  FadeInDown,
  SlideInRight,
  ZoomIn,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { curriculumService, Lesson, Subject } from '@/services/curriculumService';
import { quizService } from '@/services/quizService';
import { useAuth } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'takeaways' | 'cinematic' | 'quiz';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16);

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'ما الأسلوب الأمثل لاستيعاب مفاهيم هذا الدرس؟',
    options: [
      'الحفظ الآلي دون استيعاب',
      'الفهم العميق وربط المعلومات',
      'قراءة الملخص مرة واحدة',
      'الاعتماد الكلي على ملاحظات الزملاء',
    ],
    correctIndex: 1,
    explanation:
      'الفهم العميق وربط المفاهيم الجديدة بالمعلومات السابقة يُرسّخ التعلم في الذاكرة طويلة المدى.',
  },
  {
    id: 'q2',
    question: 'كيف تُحقّق أقصى استفادة من المواد التعليمية المتاحة؟',
    options: [
      'مشاهدة الفيديو دون تدوين ملاحظات',
      'الاطلاع على الملخص فقط',
      'المزج بين الفيديو والنصوص والاختبارات الذاتية',
      'حضور الدرس مرة واحدة',
    ],
    correctIndex: 2,
    explanation:
      'التكامل بين الوسائط المتعددة (فيديو + نص + اختبار) يُضاعف معدل الاستيعاب والاحتفاظ بالمعلومات.',
  },
  {
    id: 'q3',
    question: 'ما أهمية الاختبارات الذاتية بعد كل درس؟',
    options: [
      'مجرد إجراء روتيني لا قيمة له',
      'وسيلة لقياس مستوى الفهم وتحديد الثغرات',
      'تُضيع وقت المذاكرة',
      'لا تختلف عن إعادة قراءة النص',
    ],
    correctIndex: 1,
    explanation:
      'الاختبار الذاتي يُفعّل الاسترجاع النشط، وهو من أقوى تقنيات التعلم العلمية المُثبَتة.',
  },
];

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonPulse({ style }: { style?: object }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ backgroundColor: Colors.borderLight, borderRadius: Radius.md }, style, animStyle]}
    />
  );
}

function LessonSkeleton({ color }: { color: string }) {
  return (
    <View style={styles.container}>
      {/* Video placeholder */}
      <View style={[styles.videoWrapper, { backgroundColor: color + '20', height: VIDEO_HEIGHT }]}>
        <SkeletonPulse style={{ width: 72, height: 72, borderRadius: 36 }} />
      </View>
      {/* Tabs */}
      <View style={skeletonStyles.tabRow}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} style={{ flex: 1, height: 40, borderRadius: Radius.lg }} />
        ))}
      </View>
      {/* Content lines */}
      <View style={skeletonStyles.content}>
        <SkeletonPulse style={{ height: 24, width: '70%', alignSelf: 'flex-end' }} />
        <SkeletonPulse style={{ height: 14, marginTop: 12 }} />
        <SkeletonPulse style={{ height: 14, marginTop: 8 }} />
        <SkeletonPulse style={{ height: 14, marginTop: 8, width: '80%' }} />
        <SkeletonPulse style={{ height: 80, marginTop: 20, borderRadius: Radius.xl }} />
        <SkeletonPulse style={{ height: 80, marginTop: 12, borderRadius: Radius.xl }} />
      </View>
    </View>
  );
}

// ─── Custom Video Player ──────────────────────────────────────────────────────

interface VideoPlayerProps {
  lesson: Lesson;
  color: string;
}

function CinematicVideoPlayer({ lesson, color }: VideoPlayerProps) {
  const player = useVideoPlayer(lesson.video_url || '', (p) => {
    p.loop = false;
    p.playbackRate = 1.0;
  });

  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const controlsOpacity = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const scheduleHideControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) {
        controlsOpacity.value = withTiming(0, { duration: 400 });
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleTap = useCallback(() => {
    controlsOpacity.value = withTiming(1, { duration: 200 });
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
    scheduleHideControls();
  }, [isPlaying, player, scheduleHideControls]);

  const handleSpeedSelect = useCallback(
    (speed: number) => {
      player.playbackRate = speed;
      setSelectedSpeed(speed);
      setShowSpeedMenu(false);
      scheduleHideControls();
    },
    [player, scheduleHideControls]
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Graceful fallback: no video URL
  if (!lesson.video_url) {
    return (
      <View style={[styles.videoWrapper, { backgroundColor: color + '15' }]}>
        <Image
          source={require('@/assets/images/cinematic-placeholder.jpg')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={videoStyles.noVideoOverlay}>
          <View style={[videoStyles.playIconBg, { backgroundColor: color }]}>
            <MaterialIcons name="play-arrow" size={44} color="#FFFFFF" />
          </View>
          <Text style={videoStyles.noVideoTitle}>الفيديو التعليمي</Text>
          <Text style={videoStyles.noVideoSub}>سيتم إضافة الفيديو قريباً من قِبل المعلم</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.videoWrapper}>
      <Pressable onPress={handleTap} style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          nativeControls={false}
        />

        {/* Custom overlay controls */}
        <Animated.View style={[videoStyles.controlsOverlay, controlsStyle]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.25, 0.65, 1]}
          />

          {/* Top bar */}
          <View style={videoStyles.topBar}>
            <TouchableOpacity
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
              style={videoStyles.speedBtn}
            >
              <Text style={videoStyles.speedBtnText}>{selectedSpeed}x</Text>
            </TouchableOpacity>

            <View style={videoStyles.lessonTitleBar}>
              <Text style={videoStyles.lessonTitleText} numberOfLines={1}>
                {lesson.title_ar}
              </Text>
            </View>
          </View>

          {/* Speed menu */}
          {showSpeedMenu ? (
            <Animated.View entering={FadeIn.duration(150)} style={videoStyles.speedMenu}>
              {PLAYBACK_SPEEDS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleSpeedSelect(s)}
                  style={[
                    videoStyles.speedMenuItem,
                    selectedSpeed === s && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      videoStyles.speedMenuText,
                      selectedSpeed === s && { color: '#FFFFFF', fontWeight: FontWeight.bold },
                    ]}
                  >
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : null}

          {/* Center play/pause */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={videoStyles.centerPlayBtn}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={52}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Bottom bar */}
          <View style={videoStyles.bottomBar}>
            {/* Progress bar */}
            <View style={videoStyles.progressContainer}>
              <View style={videoStyles.progressBg}>
                <View
                  style={[
                    videoStyles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: color },
                  ]}
                />
                <View
                  style={[
                    videoStyles.progressThumb,
                    { left: `${progressPercent}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>

            {/* Time display */}
            <View style={videoStyles.timeRow}>
              <Text style={videoStyles.timeText}>{formatTime(duration)}</Text>
              <Text style={videoStyles.timeText}>{formatTime(currentTime)}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  id,
  label,
  icon,
  active,
  color,
  onPress,
}: {
  id: TabId;
  label: string;
  icon: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={({ pressed }) => [tabStyles.btn, active && { backgroundColor: color, borderColor: color }]}
    >
      <Animated.View style={[tabStyles.inner, animStyle]}>
        <MaterialIcons name={icon as any} size={16} color={active ? '#FFFFFF' : Colors.textMuted} />
        <Text style={[tabStyles.label, active && { color: '#FFFFFF' }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  lesson,
  color,
  onAskTutor,
}: {
  lesson: Lesson;
  color: string;
  onAskTutor: () => void;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(300).springify()} style={overviewStyles.container}>
      {/* Summary card */}
      <View style={overviewStyles.summaryCard}>
        <View style={overviewStyles.cardHeader}>
          <Text style={[overviewStyles.cardTitle, { color }]}>ملخص الدرس</Text>
          <MaterialIcons name="article" size={20} color={color} />
        </View>
        <Text style={overviewStyles.summaryText}>
          {lesson.content && lesson.content.trim().length > 0
            ? lesson.content
            : 'يتناول هذا الدرس المفاهيم الأساسية التي تُشكّل ركيزةً جوهريةً في فهم المادة. سيُرشدك المعلم عبر شرح تفصيلي مدعوم بأمثلة تطبيقية واقعية مستقاة من بيئتك المحيطة، مما يُيسّر الانتقال من الحفظ إلى الاستيعاب الحقيقي.'}
        </Text>
      </View>

      {/* Lesson details chips */}
      <View style={overviewStyles.detailsRow}>
        {lesson.duration_minutes > 0 ? (
          <View style={overviewStyles.chip}>
            <MaterialIcons name="schedule" size={14} color={color} />
            <Text style={[overviewStyles.chipText, { color }]}>{lesson.duration_minutes} دقيقة</Text>
          </View>
        ) : null}
        <View
          style={[
            overviewStyles.chip,
            {
              backgroundColor: lesson.is_free ? Colors.successLight : Colors.primarySurface,
            },
          ]}
        >
          <MaterialIcons
            name={lesson.is_free ? 'lock-open' : 'lock'}
            size={14}
            color={lesson.is_free ? Colors.success : Colors.primary}
          />
          <Text
            style={[
              overviewStyles.chipText,
              { color: lesson.is_free ? Colors.success : Colors.primary },
            ]}
          >
            {lesson.is_free ? 'درس مجاني' : 'درس مدفوع'}
          </Text>
        </View>
        {lesson.title_en ? (
          <View style={overviewStyles.chip}>
            <MaterialIcons name="translate" size={14} color={Colors.textMuted} />
            <Text style={overviewStyles.chipText}>{lesson.title_en}</Text>
          </View>
        ) : null}
      </View>

      {/* Learning objectives */}
      <View style={overviewStyles.objectivesCard}>
        <View style={overviewStyles.cardHeader}>
          <Text style={[overviewStyles.cardTitle, { color }]}>أهداف التعلم</Text>
          <MaterialIcons name="flag" size={20} color={color} />
        </View>
        {[
          'استيعاب المفاهيم المحورية وتطبيقها في سياقات متنوعة',
          'بناء مهارة التحليل النقدي وربط الأفكار',
          'إتقان أسلوب حل المسائل خطوةً بخطوة',
          'تنمية الاستقلالية في التعلم والبحث الذاتي',
        ].map((obj, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(i * 60).duration(250)}
            style={overviewStyles.objectiveRow}
          >
            <View style={[overviewStyles.objectiveNum, { backgroundColor: color }]}>
              <Text style={overviewStyles.objectiveNumText}>{i + 1}</Text>
            </View>
            <Text style={overviewStyles.objectiveText}>{obj}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Ask AI CTA */}
      <AskAIButton color={color} onPress={onAskTutor} lesson={lesson} />
    </Animated.View>
  );
}

// ─── Key Takeaways Tab ────────────────────────────────────────────────────────

function KeyTakeawaysTab({ lesson, color }: { lesson: Lesson; color: string }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const takeaways: string[] =
    Array.isArray(lesson.key_takeaways) && lesson.key_takeaways.length > 0
      ? lesson.key_takeaways
      : [
          'فهم المفاهيم الأساسية يُمكّنك من حل المسائل المركّبة',
          'الربط بين النظرية والتطبيق العملي ضرورة أساسية',
          'المراجعة المنتظمة تُثبّت المعلومات في الذاكرة طويلة الأمد',
          'طرح الأسئلة خطوة جوهرية في رحلة الفهم الحقيقي',
        ];

  const allChecked = checked.size === takeaways.length;

  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <Animated.View entering={FadeInUp.duration(300).springify()} style={takeawaysStyles.container}>
      {/* Progress bar */}
      <View style={takeawaysStyles.progressCard}>
        <View style={takeawaysStyles.progressHeader}>
          <Text style={takeawaysStyles.progressCount}>
            {checked.size}/{takeaways.length} مراجعة
          </Text>
          <Text style={takeawaysStyles.progressLabel}>تقدّمك في مراجعة النقاط</Text>
        </View>
        <View style={takeawaysStyles.progressBg}>
          <Animated.View
            style={[
              takeawaysStyles.progressFill,
              {
                backgroundColor: allChecked ? Colors.success : color,
                width: `${(checked.size / takeaways.length) * 100}%`,
              },
            ]}
          />
        </View>
        {allChecked ? (
          <Animated.View entering={ZoomIn.duration(300)} style={takeawaysStyles.completedBadge}>
            <MaterialIcons name="emoji-events" size={18} color={Colors.success} />
            <Text style={takeawaysStyles.completedText}>أحسنت! راجعتَ جميع النقاط الأساسية</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Takeaway cards */}
      {takeaways.map((item, i) => {
        const isChecked = checked.has(i);
        return (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(i * 80).duration(280)}
          >
            <Pressable
              onPress={() => toggleCheck(i)}
              style={({ pressed }) => [
                takeawaysStyles.card,
                isChecked && { borderColor: Colors.success, backgroundColor: Colors.successLight + '60' },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[
                  takeawaysStyles.checkbox,
                  isChecked && { backgroundColor: Colors.success, borderColor: Colors.success },
                ]}
              >
                {isChecked ? (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[takeawaysStyles.checkNum, { color }]}>{i + 1}</Text>
                )}
              </View>
              <View style={takeawaysStyles.cardContent}>
                <Text
                  style={[
                    takeawaysStyles.cardText,
                    isChecked && { color: Colors.textMuted, textDecorationLine: 'line-through' },
                  ]}
                >
                  {item}
                </Text>
              </View>
              <MaterialIcons
                name={isChecked ? 'check-circle' : 'radio-button-unchecked'}
                size={22}
                color={isChecked ? Colors.success : Colors.border}
              />
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Tip card */}
      <View style={takeawaysStyles.tipCard}>
        <MaterialIcons name="lightbulb" size={20} color={Colors.xpGold} />
        <Text style={takeawaysStyles.tipText}>
          ضَع علامة على النقاط التي راجعتها وتأكّدت من فهمها. يُساعدك هذا على تتبع تقدمك واستهداف نقاط الضعف.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Cinematic Mode Tab ───────────────────────────────────────────────────────

function CinematicModeTab({ lesson, color }: { lesson: Lesson; color: string }) {
  const [currentChapter, setCurrentChapter] = useState(0);

  const chapters = [
    { title: 'المقدمة', icon: 'play-circle-filled', time: '0:00' },
    { title: 'السياق التاريخي', icon: 'history-edu', time: '3:20' },
    { title: 'المفاهيم الأساسية', icon: 'school', time: '8:45' },
    { title: 'التطبيق العملي', icon: 'science', time: '14:10' },
    { title: 'الخلاصة', icon: 'stars', time: '19:30' },
  ];

  const narrative =
    lesson.cinematic_content && lesson.cinematic_content.trim().length > 0
      ? lesson.cinematic_content
      : 'في رحلة عبر الزمن، نتخيّل أنفسنا في قلب الحادثة... كيف تشكّل الواقع من حولنا؟ وكيف أثّرت هذه اللحظة في مسار التاريخ؟ انطلق معنا في هذه الرحلة الحصرية لاستكشاف عوالم المعرفة بأسلوب سينمائي فريد.';

  return (
    <Animated.View entering={FadeInUp.duration(300).springify()} style={cinematicStyles.container}>
      {/* Cinematic banner */}
      <View style={cinematicStyles.banner}>
        <Image
          source={require('@/assets/images/cinematic-placeholder.jpg')}
          style={cinematicStyles.bannerImage}
          contentFit="cover"
          transition={400}
        />
        <LinearGradient
          colors={['transparent', color + 'CC', color + 'FF']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <View style={cinematicStyles.bannerContent}>
          <View style={cinematicStyles.cinemaLabel}>
            <MaterialIcons name="movie" size={14} color="#FFFFFF" />
            <Text style={cinematicStyles.cinemaLabelText}>الوضع السينمائي</Text>
          </View>
          <Text style={cinematicStyles.bannerTitle}>{lesson.title_ar}</Text>
          {lesson.title_en ? (
            <Text style={cinematicStyles.bannerSubtitle}>{lesson.title_en}</Text>
          ) : null}
        </View>
      </View>

      {/* Narrative text */}
      <View style={cinematicStyles.narrativeCard}>
        <View style={cinematicStyles.narrativeHeader}>
          <Text style={[cinematicStyles.narrativeTitle, { color }]}>السرد التعليمي</Text>
          <MaterialIcons name="auto-stories" size={20} color={color} />
        </View>
        <Text style={cinematicStyles.narrativeText}>{narrative}</Text>
      </View>

      {/* Chapter navigation */}
      <View style={cinematicStyles.chaptersCard}>
        <View style={cinematicStyles.chaptersHeader}>
          <Text style={[cinematicStyles.chaptersTitle, { color }]}>فصول الدرس</Text>
          <MaterialIcons name="format-list-numbered" size={20} color={color} />
        </View>
        {chapters.map((ch, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(i * 70).duration(250)}>
            <Pressable
              onPress={() => setCurrentChapter(i)}
              style={({ pressed }) => [
                cinematicStyles.chapterRow,
                currentChapter === i && [
                  cinematicStyles.chapterRowActive,
                  { borderColor: color, backgroundColor: color + '12' },
                ],
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  cinematicStyles.chapterTime,
                  currentChapter === i && { color },
                ]}
              >
                {ch.time}
              </Text>
              <View style={cinematicStyles.chapterMeta}>
                <Text
                  style={[
                    cinematicStyles.chapterTitle,
                    currentChapter === i && { color, fontWeight: FontWeight.bold },
                  ]}
                >
                  {ch.title}
                </Text>
              </View>
              <View
                style={[
                  cinematicStyles.chapterIconBg,
                  { backgroundColor: currentChapter === i ? color : Colors.borderLight },
                ]}
              >
                <MaterialIcons
                  name={ch.icon as any}
                  size={18}
                  color={currentChapter === i ? '#FFFFFF' : Colors.textMuted}
                />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Immersive tip */}
      <View style={cinematicStyles.immersiveTip}>
        <MaterialIcons name="headphones" size={18} color={Colors.primary} />
        <Text style={cinematicStyles.immersiveTipText}>
          للاستمتاع بالتجربة الكاملة، يُنصح بمشاهدة الدرس بالشاشة الكاملة مع سماعات الأذن
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────

function QuizTab({ color, subjectId, lessonId }: { color: string; subjectId?: string; lessonId?: string }) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebrateScale = useSharedValue(0);

  const questions = QUIZ_QUESTIONS;
  const allAnswered = questions.every((q) => q.id in answers);
  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;
  const isPerfect = score === questions.length;

  const celebrateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrateScale.value }],
    opacity: interpolate(celebrateScale.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const handleSubmit = () => {
    if (!allAnswered) return;
    const currentScore = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    setSubmitted(true);
    // Save quiz result to DB (best-effort)
    if (user && subjectId && lessonId) {
      quizService.saveResult({
        student_id: user.id,
        lesson_id: lessonId,
        subject_id: subjectId,
        score: currentScore,
        total_questions: questions.length,
      }).catch(() => {});
    }
    if (currentScore >= 2) {
      setCelebrating(true);
      celebrateScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setCelebrating(false);
    celebrateScale.value = 0;
  };

  return (
    <Animated.View entering={FadeInUp.duration(300).springify()} style={quizStyles.container}>
      {/* Celebration card */}
      {celebrating ? (
        <Animated.View style={[quizStyles.celebrationCard, celebrateStyle]}>
          <LinearGradient
            colors={isPerfect ? [Colors.xpGold, '#E65100'] : [Colors.success, '#1B5E20']}
            style={quizStyles.celebrationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={quizStyles.celebrationEmoji}>
              {isPerfect ? '🏆' : score >= 2 ? '🌟' : '💪'}
            </Text>
            <Text style={quizStyles.celebrationScore}>
              {score}/{questions.length}
            </Text>
            <Text style={quizStyles.celebrationTitle}>
              {isPerfect
                ? 'ممتاز! إجابات مثالية'
                : score >= 2
                ? 'أداء رائع!'
                : 'استمر في المحاولة'}
            </Text>
            <Text style={quizStyles.celebrationSubtitle}>
              {isPerfect
                ? 'أتقنتَ هذا الدرس إتقاناً تاماً. استعد للدرس القادم!'
                : score >= 2
                ? 'راجع الأسئلة التي أخطأتَ فيها لتعزيز فهمك'
                : 'راجع الدرس ثم حاول مجدداً. أنت تتقدم!'}
            </Text>
          </LinearGradient>
        </Animated.View>
      ) : null}

      {/* Questions */}
      {questions.map((q, qi) => (
        <QuizQuestionCard
          key={q.id}
          question={q}
          index={qi}
          selected={answers[q.id] ?? -1}
          submitted={submitted}
          color={color}
          onSelect={(i) => {
            if (!submitted) setAnswers((p) => ({ ...p, [q.id]: i }));
          }}
        />
      ))}

      {/* CTA button */}
      {!submitted ? (
        <Pressable
          onPress={handleSubmit}
          disabled={!allAnswered}
          style={({ pressed }) => [
            quizStyles.submitBtn,
            { backgroundColor: allAnswered ? color : Colors.textHint },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          <Text style={quizStyles.submitText}>
            {allAnswered
              ? 'تحقق من إجاباتك'
              : `أجب على ${questions.length - Object.keys(answers).length} أسئلة متبقية`}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            quizStyles.resetBtn,
            { borderColor: color },
            pressed && { opacity: 0.8 },
          ]}
        >
          <MaterialIcons name="refresh" size={22} color={color} />
          <Text style={[quizStyles.resetText, { color }]}>إعادة الاختبار</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── Quiz Question Card ───────────────────────────────────────────────────────

function QuizQuestionCard({
  question,
  index,
  selected,
  submitted,
  color,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selected: number;
  submitted: boolean;
  color: string;
  onSelect: (i: number) => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={quizStyles.questionCard}
    >
      {/* Question header */}
      <View style={quizStyles.questionHeader}>
        <View style={[quizStyles.questionNum, { backgroundColor: color }]}>
          <Text style={quizStyles.questionNumText}>{index + 1}</Text>
        </View>
        <Text style={quizStyles.questionText}>{question.question}</Text>
      </View>

      {/* Options */}
      {question.options.map((opt, i) => {
        const isSelected = selected === i;
        const isCorrect = i === question.correctIndex;
        const showCorrect = submitted && isCorrect;
        const showWrong = submitted && isSelected && !isCorrect;

        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              quizStyles.option,
              isSelected && !submitted && {
                borderColor: color,
                backgroundColor: color + '15',
              },
              showCorrect && {
                borderColor: Colors.success,
                backgroundColor: Colors.successLight,
              },
              showWrong && {
                borderColor: Colors.error,
                backgroundColor: Colors.errorLight,
              },
              pressed && !submitted && { opacity: 0.8 },
            ]}
          >
            <View
              style={[
                quizStyles.optionCircle,
                isSelected && !submitted && { backgroundColor: color, borderColor: color },
                showCorrect && { backgroundColor: Colors.success, borderColor: Colors.success },
                showWrong && { backgroundColor: Colors.error, borderColor: Colors.error },
              ]}
            >
              {submitted && (showCorrect || showWrong) ? (
                <MaterialIcons
                  name={showCorrect ? 'check' : 'close'}
                  size={14}
                  color="#FFFFFF"
                />
              ) : isSelected ? (
                <View style={quizStyles.optionDotInner} />
              ) : null}
            </View>
            <Text
              style={[
                quizStyles.optionText,
                showCorrect && { color: Colors.success, fontWeight: FontWeight.semibold },
                showWrong && { color: Colors.error },
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}

      {/* Explanation */}
      {submitted ? (
        <Animated.View entering={FadeIn.duration(400)} style={quizStyles.explanationBox}>
          <MaterialIcons name="info" size={16} color={Colors.info} />
          <Text style={quizStyles.explanationText}>{question.explanation}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ─── Ask AI Button ────────────────────────────────────────────────────────────

function AskAIButton({
  color,
  onPress,
  lesson,
}: {
  color: string;
  onPress: () => void;
  lesson: Lesson;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={[Colors.primaryDarker, Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={aiStyles.btn}
        >
          <View style={aiStyles.iconBg}>
            <MaterialIcons name="psychology" size={26} color={Colors.primary} />
          </View>
          <View style={aiStyles.textBlock}>
            <Text style={aiStyles.title}>اسأل المعلم الذكي</Text>
            <Text style={aiStyles.subtitle}>
              اسأل عن "{lesson.title_ar}" للحصول على شرح فوري
            </Text>
          </View>
          <MaterialIcons name="arrow-back-ios" size={18} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, subjectId, nameAr, subjectColor, subjectAr } =
    useLocalSearchParams<{
      id: string;
      subjectId: string;
      nameAr: string;
      subjectColor: string;
      subjectAr: string;
    }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const color = useMemo(
    () => (subjectColor ? decodeURIComponent(subjectColor) : Colors.primary),
    [subjectColor]
  );
  const gradientColors: [string, string] = useMemo(
    () => [darkenHex(color, 45), color],
    [color]
  );

  // Fetch lesson from DB on mount
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setFetchError(null);
      const { data, error } = await curriculumService.getLessonById(id);
      if (!cancelled) {
        if (error || !data) {
          setFetchError(error ?? 'تعذّر تحميل الدرس.');
        } else {
          setLesson(data);
        }
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const handleAskTutor = useCallback(() => {
    router.push({ pathname: '/(tabs)/tutor' });
  }, [router]);

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'الملخص', icon: 'article' },
    { id: 'takeaways', label: 'النقاط', icon: 'check-circle' },
    { id: 'cinematic', label: 'سينمائي', icon: 'movie' },
    { id: 'quiz', label: 'اختبار', icon: 'quiz' },
  ];

  // ── Loading state ──
  if (loading) return <LessonSkeleton color={color} />;

  // ── Error state ──
  if (fetchError || !lesson) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradientColors} style={styles.header}>
          <HeaderBar color={color} title="خطأ" subtitle="الدرس" onBack={() => router.back()} />
        </LinearGradient>
        <View style={styles.errorState}>
          <MaterialIcons name="wifi-off" size={64} color={Colors.textHint} />
          <Text style={styles.errorTitle}>تعذّر تحميل الدرس</Text>
          <Text style={styles.errorBody}>
            {fetchError ?? 'تحقق من اتصالك بالإنترنت وأعد المحاولة.'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setFetchError(null);
              curriculumService.getLessonById(id ?? '').then(({ data, error }) => {
                if (error || !data) setFetchError(error ?? 'خطأ غير معروف.');
                else setLesson(data);
                setLoading(false);
              });
            }}
            style={[styles.retryBtn, { backgroundColor: color }]}
          >
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient colors={gradientColors} style={styles.header}>
        <HeaderBar
          color={color}
          title={lesson.title_ar}
          subtitle={subjectAr ?? 'الدرس'}
          onBack={() => router.back()}
        />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cinematic Video Player ── */}
        <CinematicVideoPlayer lesson={lesson} color={color} />

        {/* ── Tab Row ── */}
        <View style={tabStyles.row}>
          {TABS.map((t) => (
            <TabButton
              key={t.id}
              id={t.id}
              label={t.label}
              icon={t.icon}
              active={activeTab === t.id}
              color={color}
              onPress={() => setActiveTab(t.id)}
            />
          ))}
        </View>

        {/* ── Tab Content ── */}
        {activeTab === 'overview' && (
          <OverviewTab lesson={lesson} color={color} onAskTutor={handleAskTutor} />
        )}
        {activeTab === 'takeaways' && (
          <KeyTakeawaysTab lesson={lesson} color={color} />
        )}
        {activeTab === 'cinematic' && (
          <CinematicModeTab lesson={lesson} color={color} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab color={color} subjectId={subjectId} lessonId={id} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Header Bar Sub-component ─────────────────────────────────────────────────

function HeaderBar({
  color,
  title,
  subtitle,
  onBack,
}: {
  color: string;
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        style={styles.backBtn}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
      </Pressable>
      <View style={styles.headerTitle}>
        <Text style={styles.headerSubject}>{subtitle}</Text>
        <Text style={styles.headerLesson} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function darkenHex(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#1A237E';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'flex-end' },
  headerSubject: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
  },
  headerLesson: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.xl * 1.3,
  },

  // Video
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  video: { width: '100%', height: '100%' },

  // Error state
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  errorBody: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.7,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  retryBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
});

const skeletonStyles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  content: {
    padding: 16,
    gap: 8,
  },
});

// Video overlay
const videoStyles = StyleSheet.create({
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  speedBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  speedBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  lessonTitleBar: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    alignItems: 'flex-end',
  },
  lessonTitleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  speedMenu: {
    position: 'absolute',
    top: 44,
    left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minWidth: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  speedMenuItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  speedMenuText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    includeFontPadding: false,
  },

  centerPlayBtn: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  progressContainer: {
    paddingVertical: 8,
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: -4.5,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    includeFontPadding: false,
  },

  // No-video fallback
  noVideoOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    zIndex: 2,
  },
  playIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }) as object),
  },
  noVideoTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  noVideoSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.xl,
  },
});

// Tabs
const tabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    minHeight: 44,
  },
  inner: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    includeFontPadding: false,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

// Overview
const overviewStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.md },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...(Shadows.sm as object),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  summaryText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.85,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  objectivesCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...(Shadows.sm as object),
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  objectiveNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  objectiveNumText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  objectiveText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.6,
  },
});

// AI button
const aiStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...(Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }) as object),
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, alignItems: 'flex-end' },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textAlign: 'right',
    marginTop: 2,
  },
});

// Key takeaways
const takeawaysStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...(Shadows.sm as object),
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  progressCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  completedText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 64,
    ...(Shadows.sm as object),
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  cardContent: { flex: 1 },
  cardText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.55,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.7,
  },
});

// Cinematic
const cinematicStyles = StyleSheet.create({
  container: { gap: Spacing.md, paddingBottom: Spacing.md },
  banner: {
    height: 180,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    padding: Spacing.md,
    gap: 4,
  },
  cinemaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cinemaLabelText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  bannerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bannerSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    includeFontPadding: false,
  },
  narrativeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    ...(Shadows.sm as object),
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  narrativeTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  narrativeText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.85,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  chaptersCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    ...(Shadows.sm as object),
  },
  chaptersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  chaptersTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chapterRowActive: {
    borderWidth: 1,
  },
  chapterIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chapterMeta: { flex: 1 },
  chapterTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  chapterTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    minWidth: 36,
    textAlign: 'left',
    includeFontPadding: false,
  },
  immersiveTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
  },
  immersiveTipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.6,
  },
});

// Quiz
const quizStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.md },
  celebrationCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...(Shadows.lg as object),
  },
  celebrationGradient: {
    padding: Spacing.lg,
    alignItems: 'flex-end',
    gap: 4,
  },
  celebrationEmoji: { fontSize: 48, alignSelf: 'center', marginBottom: 4 },
  celebrationScore: {
    fontSize: 44,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    includeFontPadding: false,
    alignSelf: 'center',
  },
  celebrationTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    writingDirection: 'rtl',
    includeFontPadding: false,
    alignSelf: 'flex-end',
  },
  celebrationSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.6,
    alignSelf: 'flex-end',
  },

  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...(Shadows.sm as object),
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  questionNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questionNumText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  questionText: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.55,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minHeight: 48,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.5,
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  explanationText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.info,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.65,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    ...(Shadows.md as object),
  },
  submitText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
  resetText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
});
