import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export function ScreenHeader({ title, subtitle, onBack, rightAction }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {rightAction || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  left:   { width: 44 },
  center: { flex: 1, alignItems: 'center' },
  right:  { width: 44, alignItems: 'flex-end' },
  title:  { color: COLORS.text,    fontSize: 16, fontWeight: '700' },
  sub:    { color: COLORS.textSub, fontSize: 12, marginTop: 1 },
  backBtn:  { padding: 4 },
  backArrow: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
});
