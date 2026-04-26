import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SOS_STATUS } from '../constants';

const STATUS_CONFIG = {
  [SOS_STATUS.PENDING]:    { color: COLORS.warning,   label: 'Pending' },
  [SOS_STATUS.ACTIVE]:     { color: COLORS.danger,    label: 'Active' },
  [SOS_STATUS.RESPONDING]: { color: COLORS.volunteer, label: 'Responding' },
  [SOS_STATUS.RESOLVED]:   { color: COLORS.success,   label: 'Resolved' },
  [SOS_STATUS.CANCELLED]:  { color: COLORS.textMuted, label: 'Cancelled' },
};

export function StatusBadge({ status, style }) {
  const cfg = STATUS_CONFIG[status] || { color: COLORS.textMuted, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.color + '22', borderColor: cfg.color }, style]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  label: { fontSize: 12, fontWeight: '700' },
});
