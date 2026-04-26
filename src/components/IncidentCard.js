import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { formatTimeAgo } from '../utils/helpers';

export function IncidentCard({ incident, onPress, showDistance = false }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touch}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.typeIcon}>
            <Text style={styles.typeEmoji}>{typeEmoji(incident.incidentType)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.type}>{incident.incidentType}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {incident.user?.name || 'Unknown User'}
            </Text>
            <Text style={styles.time}>{formatTimeAgo(incident.createdAt)}</Text>
          </View>
          <View style={styles.meta}>
            <StatusBadge status={incident.status} />
            {showDistance && incident.distanceKm != null && (
              <Text style={styles.dist}>{incident.distanceKm.toFixed(1)} km</Text>
            )}
          </View>
        </View>
        {incident.verifications?.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.verif}>✅ {incident.verifications.length} verification(s)</Text>
            {incident.evidence?.length > 0 && (
              <Text style={styles.evid}>📎 {incident.evidence.length} evidence file(s)</Text>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function typeEmoji(type = '') {
  if (type.includes('Medical'))  return '🚑';
  if (type.includes('Crash') || type.includes('Accident')) return '🚗';
  if (type.includes('Fire'))     return '🔥';
  if (type.includes('Crime'))    return '🚨';
  if (type.includes('Natural'))  return '🌪️';
  return '⚠️';
}

const styles = StyleSheet.create({
  touch: { marginBottom: 12 },
  card:  { padding: 0 },
  row:   { flexDirection: 'row', alignItems: 'center', padding: 14 },
  typeIcon: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  typeEmoji: { fontSize: 22 },
  info:  { flex: 1 },
  type:  { color: COLORS.text,    fontSize: 14, fontWeight: '700' },
  name:  { color: COLORS.textSub, fontSize: 12, marginTop: 2 },
  time:  { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  meta:  { alignItems: 'flex-end', gap: 6 },
  dist:  { color: COLORS.textSub, fontSize: 11, marginTop: 4 },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 14, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  verif: { color: COLORS.success,   fontSize: 11 },
  evid:  { color: COLORS.textSub,   fontSize: 11 },
});
