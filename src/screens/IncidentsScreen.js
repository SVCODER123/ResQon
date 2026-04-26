import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';

import { COLORS } from '../constants';
import { sosAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNav } from '../navigation/Navigator';
import { IncidentCard } from '../components/IncidentCard';
import { EmptyState } from '../components/EmptyState';

export function IncidentsScreen() {
  const { goBack, navigate } = useNav();

  const { data, loading, refresh } = usePolling(
    () => sosAPI.getActive(),
    5000
  );

  const incidents = Array.isArray(data?.data)
    ? data.data
    : data?.data?.incidents || [];

  const renderItem = useCallback(
    ({ item }) => (
      <IncidentCard
        incident={item}
        onPress={() => navigate('IncidentDetail', { id: item._id })}
      />
    ),
    [navigate]
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Active Incidents"
        subtitle={`${incidents.length} incident(s) nearby`}
        onBack={goBack}
      />

      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="✅"
              title="No Active Incidents"
              subtitle="There are no active emergencies in your area right now."
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
});