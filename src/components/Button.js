import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, textStyle }) {
  const isOutline = variant === 'outline';
  const isDanger  = variant === 'danger';
  const isSuccess = variant === 'success';

  const bgColor = isOutline ? 'transparent'
    : isDanger  ? COLORS.danger
    : isSuccess ? COLORS.success
    : COLORS.primary;

  const borderColor = isOutline ? COLORS.primary : 'transparent';
  const color = isOutline ? COLORS.primary : COLORS.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor, borderWidth: isOutline ? 1.5 : 0, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <Text style={[styles.label, { color }, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
