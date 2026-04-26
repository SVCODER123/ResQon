import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export function EmptyState({ icon = '📭', title, subtitle, children }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon:  { fontSize: 52, marginBottom: 16 },
  title: { color: COLORS.text,    fontSize: 18, fontWeight: '700', textAlign: 'center' },
  sub:   { color: COLORS.textSub, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
