import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { COLORS, NEARBY_RADIUS_KM } from '../constants';
import { volunteerAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useLocation } from '../hooks/useLocation';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { getInitials } from '../utils/helpers';

export function VolunteersScreen() {
  const { goBack } = useNav();
  const { location } = useLocation();

  const { data, loading, refresh } = usePolling(
    () => location
      ? volunteerAPI.getNearby(location.lat, location.lng, NEARBY_RADIUS_KM)
      : Promise.resolve({ data: { data: [] } }),
    5000,
    !!location,
  );

  const volunteers = data?.data || [];

  const renderItem = ({ item }) => (
    <Card style={styles.volCard}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || 'Volunteer'}</Text>
          <Text style={styles.phone}>{item.phone || ''}</Text>
        </View>
        <View style={styles.meta}>
          {item.distanceKm != null && (
            <Text style={styles.dist}>{item.distanceKm.toFixed(1)} km</Text>
          )}
          <View style={styles.onlineDot} />
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Nearby Volunteers"
        subtitle={`Within ${NEARBY_RADIUS_KM}km radius`}
        onBack={() => goBack()}
      />
      <FlatList
        data={volunteers}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="👥"
              title="No Volunteers Nearby"
              subtitle={`No active volunteers within ${NEARBY_RADIUS_KM}km`}
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  list:    { padding: 16, flexGrow: 1 },
  volCard: { marginBottom: 10 },
  row:     { flexDirection: 'row', alignItems: 'center' },
  avatar:  { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  info:    { flex: 1 },
  name:    { color: COLORS.text,    fontSize: 14, fontWeight: '600' },
  phone:   { color: COLORS.textSub, fontSize: 12, marginTop: 2 },
  meta:    { alignItems: 'flex-end', gap: 4 },
  dist:    { color: COLORS.textSub, fontSize: 12 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.volunteer },
});
