/*
 * Madrasaty — Animated Splash Screen + Auth Router
 * Routes: logged in + verified → /(tabs) | else → /login
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/template';
import { Image } from 'expo-image';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Title slide-up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle + tagline
      Animated.stagger(150, [
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // Loading dots
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) return;

    const navigateTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    }, 2600);

    return () => clearTimeout(navigateTimer);
  }, [loading, user]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={[Colors.primaryDarker, Colors.primaryDark, Colors.primary, Colors.accent]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/splash-logo.png')}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            },
          ]}
        >
          مدرستي
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          منصة التعلم الذكي
        </Animated.Text>

        <Animated.View style={[styles.dividerRow, { opacity: taglineOpacity }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.tagline}>تعلّم · تطور · تألّق</Text>
          <View style={styles.dividerLine} />
        </Animated.View>
      </View>

      {/* Loading indicator */}
      <Animated.View style={[styles.footer, { opacity: dotsOpacity }]}>
        <LoadingDots />
        <Text style={styles.footerText}>جارٍ التحقق من الجلسة...</Text>
      </Animated.View>
    </Animated.View>
  );
}

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.stagger(150, [
          Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.stagger(150, [
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(animate);
    };
    animate();
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Decorative circles
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    bottom: -width * 0.1,
    left: -width * 0.15,
  },
  circle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: height * 0.3,
    left: -40,
  },

  // Content
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tagline: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    letterSpacing: 2,
    includeFontPadding: false,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  footerText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
