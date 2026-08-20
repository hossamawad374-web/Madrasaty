/*
 * Madrasaty — Input Component (RTL Arabic, accessible)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const hasError = Boolean(error);
  const showPasswordToggle = isPassword;
  const secureEntry = isPassword && !passwordVisible;

  const borderColor = hasError
    ? Colors.error
    : focused
    ? Colors.primary
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <View style={[styles.inputWrapper, { borderColor }, focused && styles.focused]}>
        {leftIcon ? (
          <MaterialIcons
            name={leftIcon as any}
            size={20}
            color={focused ? Colors.primary : Colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...props}
          secureTextEntry={secureEntry}
          textAlign="right"
          writingDirection="rtl"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={styles.input}
          placeholderTextColor={Colors.textHint}
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityInvalid={hasError}
        />

        {showPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={passwordVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textMuted}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={!onRightIconPress}
          >
            <MaterialIcons
              name={rightIcon as any}
              size={20}
              color={focused ? Colors.primary : Colors.textMuted}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    ...(Shadows.sm as object),
  },
  focused: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: Spacing.sm,
    includeFontPadding: false,
  },
  leftIcon: {
    marginEnd: Spacing.sm,
  },
  rightIcon: {
    marginStart: Spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
    justifyContent: 'flex-end',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
