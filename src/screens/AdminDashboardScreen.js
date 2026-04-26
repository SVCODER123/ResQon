import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';
import { adminAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { Card } from '../components/Card';
import { IncidentCard } from '../components/IncidentCard';
import { EmptyState } from '../components/EmptyState';

export function AdminDashboardScreen() {
  const { goBack, navigate } = useNav();

  const { data: dashData, loading: dashLoading, refresh: refreshDash } =
    usePolling(() => adminAPI.getDashboard(), 5000);

  const { data: incData, loading: incLoading, refresh: refreshInc } =
    usePolling(() => adminAPI.getIncidents({ status: 'active,pending,responding' }), 5000);

  const stats = dashData?.data || {};
  const incidents = incData?.data || [];

  const refresh = () => {
    refreshDash();
    refreshInc();
  };

  const renderItem = useCallback(({ item }) => (
    <IncidentCard
      incident={item}
      onPress={() => navigate('AdminIncidentDetail', { id: item._id })}
    />
  ), [navigate]);   // ✅ FIXED HERE

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Admin Dashboard"
        subtitle="Live incident management"
        rightAction={
          <TouchableOpacity onPress={() => navigate('Profile')}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={incidents}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <StatCard icon="🚨" label="Active" value={stats.active ?? '—'} color={COLORS.danger} />
              <StatCard icon="🏃" label="Responding" value={stats.responding ?? '—'} color={COLORS.volunteer} />
              <StatCard icon="✅" label="Resolved" value={stats.resolved ?? '—'} color={COLORS.success} />
              <StatCard icon="👥" label="Volunteers" value={stats.volunteers ?? '—'} color={COLORS.secondary} />
            </View>

            <Text style={styles.listHeading}>Active Incidents</Text>
          </View>
        }

        ListEmptyComponent={
          !incLoading && (
            <EmptyState
              icon="✅"
              title="All Clear"
              subtitle="No active incidents right now."
            />
          )
        }

        refreshControl={
          <RefreshControl
            refreshing={dashLoading || incLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, flexGrow: 1 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textSub, fontSize: 11, marginTop: 2 },
  listHeading: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  profileIcon: { fontSize: 22 },
});