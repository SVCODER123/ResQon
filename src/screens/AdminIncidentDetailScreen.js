import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  Modal, TouchableOpacity, TextInput, Linking,
} from 'react-native';
import { COLORS } from '../constants';
import { adminAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { formatTimeAgo, formatDateTime } from '../utils/helpers';

export function AdminIncidentDetailScreen({ route }) {
  const { goBack, navigate } = useNav();
  const { id } = route.params;
  const [routeModal,    setRouteModal]    = useState(false);
  const [routeNote,     setRouteNote]     = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const { data, refresh } = usePolling(() => adminAPI.getIncident(id), 5000);
  const incident = data?.data;

  const openInMaps = () => {
    if (!incident?.location) return;
    const { lat, lng } = incident.location;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  const doAction = async (action, label) => {
    setActionLoading(label);
    try {
      if (action === 'route') {
        await adminAPI.routeEmergency(id, { note: routeNote, agency: routeNote });
        setRouteModal(false);
        setRouteNote('');
      } else if (action === 'close') {
        await adminAPI.closeIncident(id);
        goBack();
        return;
      }
      refresh();
      Alert.alert('Done ✅', `Incident ${label} successfully.`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || `Failed to ${label}`);
    } finally { setActionLoading(''); }
  };

  const verifyEvidence = async (evidId) => {
    try { await adminAPI.verifyEvidence(evidId); refresh(); }
    catch (_) { Alert.alert('Error', 'Could not verify evidence'); }
  };

  const confirmClose = () => {
    Alert.alert('Close Incident?', 'Mark this incident as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => doAction('close', 'closed') },
    ]);
  };

  if (!incident) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Incident" onBack={() => goBack()} />
        <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Incident Control" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Location card */}
        {incident.location && (
          <Card style={styles.locCard}>
            <View style={styles.locRow}>
              <View style={styles.locLeft}>
                <Text style={styles.locLabel}>📍 Incident Location</Text>
                <Text style={styles.locCoords}>
                  {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
                </Text>
              </View>
              <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
                <Text style={styles.mapsBtnIcon}>🗺</Text>
                <Text style={styles.mapsBtnText}>Open{'\n'}Maps</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Overview */}
        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{incident.incidentType}</Text>
              <Text style={styles.info}>👤 {incident.user?.name} — {incident.user?.phone}</Text>
              <Text style={styles.info}>📅 {formatDateTime(incident.createdAt)}</Text>
            </View>
            <StatusBadge status={incident.status} />
          </View>
        </Card>

        {/* Verifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Verifications ({incident.verifications?.length || 0})</Text>
          {!incident.verifications?.length
            ? <Text style={styles.empty}>None yet</Text>
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
            ? <Text style={styles.empty}>None uploaded</Text>
            : incident.evidence.map((e, i) => (
                <View key={i} style={styles.evidRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{e.type} — {e.uploadedBy?.name}</Text>
                    <Text style={styles.listTime}>{formatTimeAgo(e.createdAt)}</Text>
                  </View>
                  {e.verified
                    ? <Text style={styles.verified}>✅ Verified</Text>
                    : (
                      <TouchableOpacity onPress={() => verifyEvidence(e._id)} style={styles.verifBtn}>
                        <Text style={styles.verifBtnText}>Verify</Text>
                      </TouchableOpacity>
                    )
                  }
                </View>
              ))
          }
        </Card>

        {/* Responders */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🏃 Responders ({incident.responders?.length || 0})</Text>
          {!incident.responders?.length
            ? <Text style={styles.empty}>No responders yet</Text>
            : incident.responders.map((r, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{r.user?.name}</Text>
                  <Text style={[styles.listTime, { color: COLORS.volunteer }]}>Responding</Text>
                </View>
              ))
          }
        </Card>

        <Button title="🚔 Route Emergency" onPress={() => setRouteModal(true)} loading={actionLoading === 'routed'} style={styles.actionBtn} />
        <Button title="✅ Close Incident"  variant="success" onPress={confirmClose} loading={actionLoading === 'closed'} style={styles.actionBtn} />

      </ScrollView>

      <Modal visible={routeModal} transparent animationType="slide" onRequestClose={() => setRouteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>🚔 Route Emergency</Text>
            <Text style={styles.modalSub}>Enter agency / routing note</Text>
            <TextInput
              value={routeNote} onChangeText={setRouteNote}
              placeholder="e.g. Police + Ambulance dispatched"
              placeholderTextColor={COLORS.textMuted}
              style={styles.noteInput} multiline numberOfLines={3}
            />
            <Button title="Confirm Route" onPress={() => doAction('route', 'routed')} loading={!!actionLoading} />
            <Button title="Cancel" variant="outline" onPress={() => setRouteModal(false)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
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
  mapsBtn:  { alignItems: 'center', backgroundColor: COLORS.secondary + '22', borderRadius: 10, padding: 10 },
  mapsBtnIcon: { fontSize: 22 },
  mapsBtnText: { color: COLORS.secondary, fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  section:  { marginBottom: 14 },
  row:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  type:     { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  info:     { color: COLORS.textSub, fontSize: 13, marginBottom: 3 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  empty:    { color: COLORS.textMuted, fontSize: 13 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listName: { color: COLORS.text, fontSize: 13 },
  listTime: { color: COLORS.textSub, fontSize: 12 },
  evidRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  verified: { color: COLORS.success, fontSize: 12 },
  verifBtn: { backgroundColor: COLORS.secondary + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  verifBtnText: { color: COLORS.secondary, fontSize: 12, fontWeight: '600' },
  actionBtn:{ marginBottom: 12 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub:   { color: COLORS.textSub, fontSize: 13, marginBottom: 16 },
  noteInput:  { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, padding: 14, fontSize: 14, marginBottom: 16, textAlignVertical: 'top', minHeight: 80 },
});
