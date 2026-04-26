import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';

import { COLORS } from '../constants';
import { adminAPI, evidenceAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { formatTimeAgo, formatDateTime } from '../utils/helpers';

export function AdminIncidentDetailScreen({ route }) {
  const { goBack } = useNav();
  const { id } = route.params;

  const [routeModal, setRouteModal] = useState(false);
  const [routeNote, setRouteNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const { data, refresh } = usePolling(() => adminAPI.getIncident(id), 5000);
  const incident = data?.data;

  const loadEvidence = async () => {
    try {
      setEvidenceLoading(true);
      const res = await evidenceAPI.getAll(id);

      const list = Array.isArray(res?.data)
        ? res.data
        : res?.data?.evidence || res?.data?.data || [];

      setEvidence(list);
    } catch (e) {
      console.log('ADMIN EVIDENCE LOAD ERROR:', e?.response?.data || e.message);
      setEvidence([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadEvidence();
  }, [id]);

  const openInMaps = () => {
    if (!incident?.location) return;
    const { lat, lng } = incident.location;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  const openEvidence = async (item) => {
    const url = item.url || item.fileUrl || item.mediaUrl || item.path;

    if (!url) {
      Alert.alert('No File', 'This evidence has no readable file URL.');
      return;
    }

    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert('Cannot Open', 'This file URL cannot be opened on this device.');
      return;
    }

    Linking.openURL(url);
  };

  const doAction = async (action, label) => {
    setActionLoading(label);

    try {
      if (action === 'route') {
        await adminAPI.routeEmergency(id, {
          note: routeNote,
          agency: routeNote,
        });

        setRouteModal(false);
        setRouteNote('');
      } else if (action === 'close') {
        await adminAPI.closeIncident(id);
        goBack();
        return;
      }

      refresh();
      await loadEvidence();

      Alert.alert('Done ✅', `Incident ${label} successfully.`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || `Failed to ${label}`);
    } finally {
      setActionLoading('');
    }
  };

  const verifyEvidence = async (evidId) => {
    try {
      setActionLoading(evidId);
      await adminAPI.verifyEvidence(evidId);
      await loadEvidence();
      refresh();
      Alert.alert('Verified ✅', 'Evidence verified successfully.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not verify evidence');
    } finally {
      setActionLoading('');
    }
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
        <ScreenHeader title="Incident" onBack={goBack} />
        <View style={styles.center}>
          <Text style={styles.loading}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Incident Control" onBack={goBack} />

      <ScrollView contentContainerStyle={styles.scroll}>
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

        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{incident.incidentType}</Text>
              <Text style={styles.info}>
                👤 {incident.user?.name || 'Unknown'} — {incident.user?.phone || 'No phone'}
              </Text>
              <Text style={styles.info}>📅 {formatDateTime(incident.createdAt)}</Text>
            </View>

            <StatusBadge status={incident.status} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✅ Verifications ({incident.verifications?.length || 0})
          </Text>

          {!incident.verifications?.length ? (
            <Text style={styles.empty}>None yet</Text>
          ) : (
            incident.verifications.map((v, i) => (
              <View key={v._id || i} style={styles.listItem}>
                <Text style={styles.listName}>{v.user?.name || 'User'}</Text>
                <Text style={styles.listTime}>{formatTimeAgo(v.createdAt)}</Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📎 Uploaded Evidence ({evidence.length})</Text>

            {evidenceLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {evidence.length === 0 ? (
            <Text style={styles.empty}>No evidence uploaded yet.</Text>
          ) : (
            evidence.map((item, index) => {
              const fileUrl = item.url || item.fileUrl || item.mediaUrl || item.path;
              const uploadedBy = item.uploadedBy?.name || item.user?.name || 'User / Volunteer';

              return (
                <View key={item._id || index} style={styles.evidenceCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.evidenceTitle}>
                      {item.type || item.mimeType || 'Evidence'} — {uploadedBy}
                    </Text>

                    <Text style={styles.evidenceMeta}>
                      Uploaded: {item.createdAt ? formatTimeAgo(item.createdAt) : 'Recently'}
                    </Text>

                    <Text style={styles.evidenceMeta}>
                      Status: {item.verified ? 'Verified' : 'Pending verification'}
                    </Text>

                    <Text style={styles.evidenceUrl} numberOfLines={1}>
                      {fileUrl || 'No file URL available'}
                    </Text>

                    {item.description ? (
                      <Text style={styles.evidenceDescription}>{item.description}</Text>
                    ) : null}
                  </View>

                  <View style={styles.evidenceActions}>
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={() => openEvidence(item)}
                    >
                      <Text style={styles.openBtnText}>Open</Text>
                    </TouchableOpacity>

                    {item.verified ? (
                      <Text style={styles.verified}>✅ Verified</Text>
                    ) : (
                      <TouchableOpacity
                        onPress={() => verifyEvidence(item._id)}
                        style={styles.verifBtn}
                        disabled={actionLoading === item._id}
                      >
                        <Text style={styles.verifBtnText}>
                          {actionLoading === item._id ? '...' : 'Verify'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏃 Responders ({incident.responders?.length || 0})
          </Text>

          {!incident.responders?.length ? (
            <Text style={styles.empty}>No responders yet</Text>
          ) : (
            incident.responders.map((r, i) => (
              <View key={r._id || i} style={styles.listItem}>
                <Text style={styles.listName}>{r.user?.name || 'Responder'}</Text>
                <Text style={[styles.listTime, { color: COLORS.volunteer }]}>
                  Responding
                </Text>
              </View>
            ))
          )}
        </Card>

        <Button
          title="🚔 Route Emergency"
          onPress={() => setRouteModal(true)}
          loading={actionLoading === 'routed'}
          style={styles.actionBtn}
        />

        <Button
          title="✅ Close Incident"
          variant="success"
          onPress={confirmClose}
          loading={actionLoading === 'closed'}
          style={styles.actionBtn}
        />
      </ScrollView>

      <Modal
        visible={routeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRouteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>🚔 Route Emergency</Text>
            <Text style={styles.modalSub}>Enter agency / routing note</Text>

            <TextInput
              value={routeNote}
              onChangeText={setRouteNote}
              placeholder="e.g. Police + Ambulance dispatched"
              placeholderTextColor={COLORS.textMuted}
              style={styles.noteInput}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Confirm Route"
              onPress={() => doAction('route', 'routed')}
              loading={!!actionLoading}
            />

            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setRouteModal(false)}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: COLORS.textSub },
  scroll: { padding: 16, paddingBottom: 40 },

  locCard: { marginBottom: 14, borderColor: COLORS.danger + '55' },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locLeft: { flex: 1 },
  locLabel: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  locCoords: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  mapsBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '22',
    borderRadius: 10,
    padding: 10,
  },
  mapsBtnIcon: { fontSize: 22 },
  mapsBtnText: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },

  section: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  type: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  info: { color: COLORS.textSub, fontSize: 13, marginBottom: 3 },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  empty: { color: COLORS.textMuted, fontSize: 13 },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listName: { color: COLORS.text, fontSize: 13 },
  listTime: { color: COLORS.textSub, fontSize: 12 },

  evidenceCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  evidenceTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  evidenceMeta: {
    color: COLORS.textSub,
    fontSize: 12,
    marginBottom: 3,
  },
  evidenceUrl: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  evidenceDescription: {
    color: COLORS.textSub,
    fontSize: 12,
    marginTop: 6,
  },
  evidenceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  openBtn: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  openBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  verified: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  verifBtn: {
    backgroundColor: COLORS.secondary + '22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifBtnText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },

  actionBtn: { marginBottom: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    color: COLORS.textSub,
    fontSize: 13,
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
});