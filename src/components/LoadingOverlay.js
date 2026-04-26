import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { COLORS } from '../constants';

export function LoadingOverlay({ visible, message = 'Please wait...' }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000BB', alignItems: 'center', justifyContent: 'center' },
  box: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 32, alignItems: 'center', minWidth: 180,
    borderWidth: 1, borderColor: COLORS.border,
  },
  text: { color: COLORS.textSub, marginTop: 14, fontSize: 14 },
});
