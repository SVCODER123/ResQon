import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { COLORS, NEARBY_RADIUS_KM } from '../constants';
import { sosAPI, volunteerAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useLocation } from '../hooks/useLocation';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { formatTimeAgo } from '../utils/helpers';

export function MapScreen() {
  const { goBack, navigate } = useNav();
  const { location } = useLocation(true);

  const { data: activeData, refresh } = usePolling(() => sosAPI.getActive(), 5000);
  const { data: volData } = usePolling(
    () => location
      ? volunteerAPI.getNearby(location.lat, location.lng, NEARBY_RADIUS_KM)
      : Promise.resolve(null),
    5000,
    !!location,
  );

  const incidents  = activeData?.data  || [];
  const volunteers = volData?.data     || [];

  const openInMaps = (lat, lng, label) => {
    const url = `https://maps.google.com/?q=${lat},${lng}&label=${encodeURIComponent(label)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Live Map"
        subtitle={`${incidents.length} active incident(s)`}
        onBack={() => goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Your location */}
        {location && (
          <Card style={styles.myLoc}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.locTitle}>Your Location</Text>
                <Text style={styles.locCoords}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
                <Text style={styles.locAcc}>Accuracy: ±{Math.round(location.accuracy || 0)}m</Text>
              </View>
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => openInMaps(location.lat, location.lng, 'My Location')}
              >
                <Text style={styles.mapBtnText}>Open{'\n'}Maps</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Active Incidents */}
        <Text style={styles.sectionTitle}>🚨 Active Incidents ({incidents.length})</Text>
        {!incidents.length ? (
          <Card><Text style={styles.empty}>No active incidents nearby</Text></Card>
        ) : (
          incidents.map(inc => (
            inc.location ? (
              <Card key={inc._id} style={styles.incCard}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: '#FF174422' }]}>
                    <Text style={styles.iconText}>{typeEmoji(inc.incidentType)}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.incType}>{inc.incidentType}</Text>
                    <Text style={styles.incName}>{inc.user?.name || 'Unknown'}</Text>
                    <Text style={styles.incCoords}>
                      {inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)}
                    </Text>
                    <Text style={styles.incTime}>{formatTimeAgo(inc.createdAt)}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <StatusBadge status={inc.status} />
                    <TouchableOpacity
                      style={styles.mapBtn}
                      onPress={() => openInMaps(inc.location.lat, inc.location.lng, inc.incidentType)}
                    >
                      <Text style={styles.mapBtnText}>Open{'\n'}Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ) : null
          ))
        )}

        {/* Nearby Volunteers */}
        <Text style={styles.sectionTitle}>🛡️ Nearby Volunteers ({volunteers.length})</Text>
        {!volunteers.length ? (
          <Card><Text style={styles.empty}>No volunteers within {NEARBY_RADIUS_KM}km</Text></Card>
        ) : (
          volunteers.map(vol => (
            <Card key={vol._id} style={styles.volCard}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: '#00BFA522' }]}>
                  <Text style={[styles.iconText, { color: COLORS.volunteer }]}>
                    {(vol.name || 'V')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.incType}>{vol.name || 'Volunteer'}</Text>
                  <Text style={styles.incName}>{vol.phone || ''}</Text>
                  {vol.distanceKm != null && (
                    <Text style={styles.incCoords}>{vol.distanceKm.toFixed(1)} km away</Text>
                  )}
                </View>
                <View style={styles.onlineDot} />
              </View>
            </Card>
          ))
        )}

        <View style={styles.refreshRow}>
          <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
            <Text style={styles.refreshText}>↻  Refresh</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function typeEmoji(type = '') {
  if (type.includes('Medical'))  return '🚑';
  if (type.includes('Crash') || type.includes('Accident')) return '🚗';
  if (type.includes('Fire'))     return '🔥';
  if (type.includes('Crime'))    return '🚨';
  if (type.includes('Natural'))  return '🌪';
  return '⚠️';
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { padding: 14, paddingBottom: 40 },
  myLoc:        { marginBottom: 16, borderColor: COLORS.secondary + '66' },
  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightCol:     { alignItems: 'flex-end', gap: 6 },
  iconBox: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconText:   { fontSize: 20 },
  info:       { flex: 1 },
  locTitle:   { color: COLORS.text,    fontSize: 13, fontWeight: '600' },
  locCoords:  { color: COLORS.textSub, fontSize: 11, marginTop: 2 },
  locAcc:     { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  incCard:    { marginBottom: 10 },
  incType:    { color: COLORS.text,    fontSize: 13, fontWeight: '600' },
  incName:    { color: COLORS.textSub, fontSize: 11, marginTop: 2 },
  incCoords:  { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  incTime:    { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  volCard:    { marginBottom: 10 },
  onlineDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.volunteer },
  mapBtn: {
    backgroundColor: COLORS.secondary + '22',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    alignItems: 'center',
  },
  mapBtnText: { color: COLORS.secondary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  empty:      { color: COLORS.textMuted, fontSize: 12 },
  refreshRow: { alignItems: 'center', marginTop: 10 },
  refreshBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  refreshText: { color: COLORS.textSub, fontSize: 13 },
});
