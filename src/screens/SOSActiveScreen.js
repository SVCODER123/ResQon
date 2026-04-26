import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { COLORS } from '../constants';
import { useSOS } from '../hooks/useSOS';
import { usePolling } from '../hooks/usePolling';
import { sosAPI, volunteerAPI } from '../services/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatTimeAgo } from '../utils/helpers';

export function SOSActiveScreen() {
  const { goBack, navigate } = useNav();
  const { sos, cancelSOS } = useSOS();

  const { data: sosDetails } = usePolling(
    () => sos ? sosAPI.getById(sos._id) : Promise.resolve(null),
    5000, !!sos,
  );
  const { data: responders } = usePolling(
    () => sos ? volunteerAPI.getResponders(sos._id) : Promise.resolve(null),
    5000, !!sos,
  );

  const incident = sosDetails?.data || sos;
  const respList  = responders?.data || [];
  const lat = incident?.location?.lat;
  const lng = incident?.location?.lng;

  const openInMaps = () => {
    if (!lat || !lng) return;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  const handleCancel = () => {
    Alert.alert('Cancel SOS?', 'Are you sure you want to cancel the emergency alert?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        await cancelSOS();
        goBack();
      }},
    ]);
  };

  if (!sos) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="SOS Status" onBack={() => goBack()} />
        <View style={styles.center}><Text style={styles.noSos}>No active SOS</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="SOS Active"
        subtitle={formatTimeAgo(incident?.createdAt)}
        onBack={() => goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Live Location Card */}
        <Card style={styles.locCard}>
          <View style={styles.locRow}>
            <View style={styles.locLeft}>
              <Text style={styles.locLabel}>📍 Live Location</Text>
              {lat && lng ? (
                <Text style={styles.locCoords}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text>
              ) : (
                <Text style={styles.locCoords}>Acquiring location...</Text>
              )}
              <Text style={styles.locSub}>Broadcasting to responders every 5s</Text>
            </View>
            {lat && lng && (
              <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
                <Text style={styles.mapsBtnIcon}>🗺</Text>
                <Text style={styles.mapsBtnText}>Open{'\n'}Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Status */}
        <Card style={styles.statusCard}>
          <View style={styles.row}>
            <View>
              <Text style={styles.incidentType}>{incident?.incidentType || 'Emergency'}</Text>
              <Text style={styles.time}>{formatTimeAgo(incident?.createdAt)}</Text>
            </View>
            <StatusBadge status={incident?.status} />
          </View>
        </Card>

        {/* Verifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Verifications ({incident?.verifications?.length || 0})</Text>
          {!incident?.verifications?.length
            ? <Text style={styles.empty}>Waiting for nearby volunteers to verify...</Text>
            : incident.verifications.map((v, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{v.user?.name || 'Volunteer'}</Text>
                  <Text style={styles.listTime}>{formatTimeAgo(v.createdAt)}</Text>
                </View>
              ))
          }
        </Card>

        {/* Responders */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🏃 Responding ({respList.length})</Text>
          {!respList.length
            ? <Text style={styles.empty}>No responders yet...</Text>
            : respList.map((r, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{r.user?.name || 'Volunteer'}</Text>
                  <Text style={[styles.listTime, { color: COLORS.volunteer }]}>On the way</Text>
                </View>
              ))
          }
        </Card>

        <Button
          title="📎 Upload Evidence"
          variant="outline"
          onPress={() => navigate('Evidence', { sosId: sos._id })}
          style={styles.evBtn}
        />
        <Button title="Cancel SOS" variant="danger" onPress={handleCancel} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { padding: 16, paddingBottom: 40 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noSos:        { color: COLORS.textSub, fontSize: 16 },
  locCard:      { marginBottom: 14, borderColor: COLORS.danger + '55' },
  locRow:       { flexDirection: 'row', alignItems: 'center' },
  locLeft:      { flex: 1 },
  locLabel:     { color: COLORS.textSub, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  locCoords:    { color: COLORS.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  locSub:       { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  mapsBtn:      { alignItems: 'center', backgroundColor: COLORS.secondary + '22', borderRadius: 10, padding: 10 },
  mapsBtnIcon:  { fontSize: 22 },
  mapsBtnText:  { color: COLORS.secondary, fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  statusCard:   { marginBottom: 14 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  incidentType: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  time:         { color: COLORS.textSub, fontSize: 12, marginTop: 4 },
  section:      { marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  empty:        { color: COLORS.textMuted, fontSize: 13 },
  listItem:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listName:     { color: COLORS.text, fontSize: 13 },
  listTime:     { color: COLORS.textSub, fontSize: 12 },
  evBtn:        { marginBottom: 12 },
});
