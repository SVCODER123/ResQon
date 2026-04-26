import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { COLORS } from '../constants';
import { sosAPI, volunteerAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useLocation } from '../hooks/useLocation';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatTimeAgo, formatDateTime } from '../utils/helpers';
import { LocationService } from '../services/LocationService';

export function IncidentDetailScreen({ route }) {
  const { goBack, navigate } = useNav();
  const { id } = route.params;
  const { location } = useLocation();
  const [accepting, setAccepting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data, refresh } = usePolling(() => sosAPI.getById(id), 5000);
  const incident = data?.data;

  const distKm = incident?.location && location
    ? LocationService.distanceBetween(location.lat, location.lng, incident.location.lat, incident.location.lng)
    : null;

  const openInMaps = () => {
    if (!incident?.location) return;
    const { lat, lng } = incident.location;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}&label=${encodeURIComponent(incident.incidentType)}`);
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await volunteerAPI.acceptIncident(id);
      Alert.alert('Accepted ✅', 'You are now responding. Your location will be shared.');
      refresh();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not accept');
    } finally { setAccepting(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await sosAPI.verify(id, { confirmed: true });
      Alert.alert('Verified ✅', 'Thank you for verifying this incident.');
      refresh();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not verify');
    } finally { setVerifying(false); }
  };

  if (!incident) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Incident Details" onBack={() => goBack()} />
        <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Incident Details"
        subtitle={distKm != null ? `${distKm.toFixed(1)} km away` : ''}
        onBack={() => goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Location Card with Maps button */}
        {incident.location && (
          <Card style={styles.locCard}>
            <View style={styles.locRow}>
              <View style={styles.locLeft}>
                <Text style={styles.locLabel}>📍 Incident Location</Text>
                <Text style={styles.locCoords}>
                  {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
                </Text>
                {distKm != null && (
                  <Text style={styles.distText}>{distKm.toFixed(1)} km from you</Text>
                )}
              </View>
              <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
                <Text style={styles.mapsBtnIcon}>🗺</Text>
                <Text style={styles.mapsBtnText}>Open{'\n'}Maps</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{incident.incidentType}</Text>
              <Text style={styles.user}>by {incident.user?.name || 'Unknown'}</Text>
              <Text style={styles.time}>{formatDateTime(incident.createdAt)}</Text>
            </View>
            <StatusBadge status={incident.status} />
          </View>
        </Card>

        {/* Verifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Verifications ({incident.verifications?.length || 0})</Text>
          {!incident.verifications?.length
            ? <Text style={styles.empty}>No verifications yet</Text>
            : incident.verifications.map((v, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{v.user?.name}</Text>
                  <Text style={styles.listTime}>{formatTimeAgo(v.createdAt)}</Text>
                </View>
              ))
          }
        </Card>

        {/* Evidence */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📎 Evidence ({incident.evidence?.length || 0})</Text>
          {!incident.evidence?.length
            ? <Text style={styles.empty}>No evidence uploaded</Text>
            : incident.evidence.map((e, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{e.type} — {e.uploadedBy?.name}</Text>
                  <Text style={styles.listTime}>{formatTimeAgo(e.createdAt)}</Text>
                </View>
              ))
          }
        </Card>

        <Button title="✅ Verify Incident"     onPress={handleVerify} loading={verifying} style={styles.actionBtn} />
        <Button title="🏃 Respond to Incident" variant="danger" onPress={handleAccept} loading={accepting} style={styles.actionBtn} />
        <Button title="📎 Upload Evidence"     variant="outline" onPress={() => navigate('Evidence', { sosId: id })} style={styles.actionBtn} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: COLORS.bg },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading:  { color: COLORS.textSub },
  scroll:   { padding: 16, paddingBottom: 40 },
  locCard:  { marginBottom: 14, borderColor: COLORS.danger + '55' },
  locRow:   { flexDirection: 'row', alignItems: 'center' },
  locLeft:  { flex: 1 },
  locLabel: { color: COLORS.textSub, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  locCoords:{ color: COLORS.text, fontSize: 14, fontWeight: '700' },
  distText: { color: COLORS.volunteer, fontSize: 11, marginTop: 4 },
  mapsBtn:  { alignItems: 'center', backgroundColor: COLORS.secondary + '22', borderRadius: 10, padding: 10 },
  mapsBtnIcon: { fontSize: 22 },
  mapsBtnText: { color: COLORS.secondary, fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  infoCard: { marginBottom: 14 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  type:     { color: COLORS.text,    fontSize: 16, fontWeight: '700' },
  user:     { color: COLORS.textSub, fontSize: 13, marginTop: 3 },
  time:     { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  section:  { marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  empty:    { color: COLORS.textMuted, fontSize: 13 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listName: { color: COLORS.text, fontSize: 13 },
  listTime: { color: COLORS.textSub, fontSize: 12 },
  actionBtn:{ marginBottom: 12 },
});
