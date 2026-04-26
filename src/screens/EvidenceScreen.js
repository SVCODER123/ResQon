import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants';
import { evidenceAPI } from '../services/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatTimeAgo } from '../utils/helpers';
import { usePolling } from '../hooks/usePolling';

export function EvidenceScreen({ route }) {
  const { goBack } = useNav();
  const sosId = route?.params?.sosId;
  const [uploading, setUploading] = useState(false);
  const [selected,  setSelected]  = useState(null);

  const { data, refresh } = usePolling(
    () => sosId ? evidenceAPI.getAll(sosId) : Promise.resolve({ data: { data: [] } }),
    0,
    false,
  );

  const evidence = data?.data || [];

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) setSelected(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) setSelected(result.assets[0]);
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (!result.canceled && result.assets?.[0]) setSelected(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!selected) return Alert.alert('No file selected', 'Please pick a photo or video first.');
    if (!sosId)    return Alert.alert('Error', 'No SOS ID associated.');

    setUploading(true);
    try {
      const uri  = selected.uri;
      const type = selected.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const name = uri.split('/').pop() || `evidence_${Date.now()}`;

      const form = new FormData();
      form.append('file', { uri, type, name });
      form.append('type', selected.type === 'video' ? 'video' : 'photo');

      await evidenceAPI.upload(sosId, form);
      Alert.alert('Uploaded ✅', 'Evidence uploaded successfully.');
      setSelected(null);
      refresh();
    } catch (e) {
      Alert.alert('Upload Failed', e?.response?.data?.message || 'Could not upload. Check your connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Evidence"
        subtitle={sosId ? 'Upload for this incident' : 'No incident selected'}
        onBack={() => goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Card style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>📎 Upload Evidence</Text>
          <Text style={styles.sub}>Photo or video evidence helps verify the emergency.</Text>

          <View style={styles.pickRow}>
            <PickBtn icon="📷" label="Camera"  onPress={pickFromCamera} />
            <PickBtn icon="🖼️" label="Gallery" onPress={pickFromGallery} />
            <PickBtn icon="🎥" label="Video"   onPress={pickVideo} />
          </View>

          {selected && (
            <View style={styles.preview}>
              {selected.type !== 'video' ? (
                <Image source={{ uri: selected.uri }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.videoPreview}>
                  <Text style={styles.videoIcon}>🎥</Text>
                  <Text style={styles.videoName} numberOfLines={1}>
                    {selected.uri.split('/').pop() || 'video file'}
                  </Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <Button
            title={uploading ? 'Uploading...' : '⬆️  Upload Evidence'}
            onPress={handleUpload}
            loading={uploading}
            disabled={!selected}
            style={styles.uploadBtn}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Uploaded ({evidence.length})</Text>
          {!evidence.length ? (
            <Text style={styles.empty}>No evidence uploaded yet</Text>
          ) : (
            evidence.map((e, i) => (
              <View key={i} style={styles.evidItem}>
                <Text style={styles.evidType}>
                  {e.type === 'photo' ? '🖼️' : e.type === 'video' ? '🎥' : '🎙️'} {e.type}
                </Text>
                <View>
                  <Text style={styles.evidBy}>{e.uploadedBy?.name || 'Unknown'}</Text>
                  <Text style={styles.evidTime}>{formatTimeAgo(e.createdAt)}</Text>
                </View>
                {e.verified && <Text style={styles.evidVerif}>✅</Text>}
              </View>
            ))
          )}
        </Card>

      </ScrollView>
    </View>
  );
}

function PickBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.pickBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.pickIcon}>{icon}</Text>
      <Text style={styles.pickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.bg },
  scroll:     { padding: 16, paddingBottom: 40 },
  uploadCard: { marginBottom: 14 },
  section:    { marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sub:        { color: COLORS.textSub, fontSize: 13, marginBottom: 16 },
  pickRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pickBtn:    { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, alignItems: 'center', paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border },
  pickIcon:   { fontSize: 24 },
  pickLabel:  { color: COLORS.textSub, fontSize: 11, marginTop: 4 },
  preview:    { marginBottom: 14 },
  previewImg: { width: '100%', height: 180, borderRadius: 10 },
  videoPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, gap: 10 },
  videoIcon:  { fontSize: 28 },
  videoName:  { flex: 1, color: COLORS.text, fontSize: 13 },
  removeBtn:  { marginTop: 8, alignSelf: 'flex-end' },
  removeText: { color: COLORS.danger, fontSize: 13 },
  uploadBtn:  { marginTop: 4 },
  empty:      { color: COLORS.textMuted, fontSize: 13 },
  evidItem:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  evidType:   { color: COLORS.text, fontSize: 13, flex: 1 },
  evidBy:     { color: COLORS.textSub, fontSize: 12 },
  evidTime:   { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  evidVerif:  { fontSize: 16 },
});
