import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';

import { COLORS, INCIDENT_TYPES, SOS_STATUS } from '../constants';
import { useSOS } from '../hooks/useSOS';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { useNav } from '../navigation/Navigator';
import { CrashDetectionService } from '../services/CrashDetectionService';
import { SirenService } from '../services/SirenService';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';

export function HomeScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { sos, loading, triggerSOS, cancelSOS } = useSOS();
  const { location } = useLocation(true);

  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [typeModal, setTypeModal] = useState(false);
  const [crashWarning, setCrashWarning] = useState(false);
  const [crashCountdown, setCrashCountdown] = useState(10);

  const holdTimer = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    CrashDetectionService.start(() => {
      setCrashWarning(true);
      setCrashCountdown(10);

      // Siren should never block SOS logic
      SirenService.start().catch((error) => {
        console.log('SIREN START ERROR:', error?.message || error);
      });

      countdownRef.current = setInterval(() => {
        setCrashCountdown((count) => {
          if (count <= 1) {
            clearInterval(countdownRef.current);
            setCrashWarning(false);

            triggerSOS('Accident / Crash').catch((error) => {
              console.log(
                'AUTO SOS ERROR:',
                error?.response?.data || error?.message || error
              );
            });

            return 0;
          }

          return count - 1;
        });
      }, 1000);
    });

    return () => {
      CrashDetectionService.stop();

      if (holdTimer.current) {
        clearInterval(holdTimer.current);
      }

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [triggerSOS]);

  const startHold = () => {
    if (sos || loading) return;

    setHolding(true);
    setHoldProgress(0);

    const start = Date.now();

    holdTimer.current = setInterval(() => {
      const progress = Math.min((Date.now() - start) / 3000, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        clearInterval(holdTimer.current);
        setHolding(false);
        setHoldProgress(0);
        setTypeModal(true);
      }
    }, 50);
  };

  const stopHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
    }

    setHolding(false);
    setHoldProgress(0);
  };

  const handleTypeSelect = async (type) => {
    setTypeModal(false);

    try {
      await triggerSOS(type);
    } catch (error) {
      console.log(
        'SOS TRIGGER ERROR FULL:',
        error?.response?.data || error?.message || error
      );

      console.log('SOS TRIGGER STATUS:', error?.response?.status);

      Alert.alert(
        'SOS Failed',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to trigger SOS. Check connection.'
      );
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel SOS?', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelSOS();
          await SirenService.stop();
        },
      },
    ]);
  };

  const isActive =
    sos && [SOS_STATUS.ACTIVE, SOS_STATUS.RESPONDING].includes(sos.status);

  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={loading} message="Sending SOS..." />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0] || 'User'} 👋
          </Text>
          <Text style={styles.sub}>
            {user?.role === 'admin'
              ? 'Admin'
              : user?.role === 'volunteer'
              ? 'Registered volunteer'
              : 'Registered user'}
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigate('Profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isActive && (
          <Card style={styles.activeBanner}>
            <View style={styles.activeHeader}>
              <Text style={styles.activeIcon}>🚨</Text>
              <View>
                <Text style={styles.activeTitle}>SOS Active</Text>
                <StatusBadge status={sos.status} />
              </View>
            </View>

            <Text style={styles.activeSubtitle}>Help is on the way.</Text>

            <View style={styles.activeActions}>
              <Button
                title="View Details"
                variant="outline"
                onPress={() => navigate('SOSActive')}
                style={styles.actionBtn}
              />

              <Button
                title="Cancel SOS"
                variant="danger"
                onPress={handleCancel}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        )}

        <View style={styles.sosSection}>
          <Text style={styles.instruction}>
            {isActive ? 'Your SOS is active' : 'Hold 3 seconds to trigger SOS'}
          </Text>

          <TouchableOpacity
            onPressIn={isActive ? undefined : startHold}
            onPressOut={isActive ? undefined : stopHold}
            activeOpacity={0.9}
            style={[styles.sosBtn, isActive && styles.sosBtnActive]}
            disabled={loading || isActive}
          >
            <Text style={styles.sosBtnLabel}>SOS</Text>

            {holding && (
              <Text style={styles.holdHint}>
                {Math.round(holdProgress * 100)}%
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.crashNote}>📡 Crash detection active</Text>
        </View>

        <View style={styles.quickGrid}>
          {[
            ['📍', 'Map', 'Map'],
            ['👥', 'Volunteers', 'Volunteers'],
            ['📋', 'Incidents', 'Incidents'],
            ['📎', 'Evidence', 'Evidence'],
          ].map(([icon, label, screen]) => (
            <TouchableOpacity
              key={screen}
              style={styles.qa}
              onPress={() => navigate(screen)}
              activeOpacity={0.8}
            >
              <View style={styles.qaIcon}>
                <Text style={styles.qaIconText}>{icon}</Text>
              </View>
              <Text style={styles.qaLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {location && (
          <Card>
            <Text style={styles.locationLabel}>📍 Your Location</Text>
            <Text style={styles.locationCoords}>
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </Text>
            <Text style={styles.locationAccuracy}>
              Accuracy: ±{Math.round(location.accuracy || 0)}m
            </Text>
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={typeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTypeModal(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>🚨 Select Emergency Type</Text>

            <FlatList
              data={INCIDENT_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.typeItem}
                  onPress={() => handleTypeSelect(item)}
                >
                  <Text style={styles.typeText}>{item}</Text>
                  <Text style={styles.typeArrow}>›</Text>
                </TouchableOpacity>
              )}
            />

            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setTypeModal(false)}
              style={styles.cancelBtn}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={crashWarning} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={[styles.sheet, styles.crashSheet]}>
            <Text style={styles.crashIcon}>💥</Text>
            <Text style={styles.crashTitle}>Crash Detected!</Text>
            <Text style={styles.crashCounter}>{crashCountdown}</Text>

            <Text style={styles.crashText}>
              SOS will auto-trigger. Press "I'm OK" to cancel.
            </Text>

            <Button
              title="I'm OK — Cancel"
              variant="success"
              onPress={() => {
                if (countdownRef.current) {
                  clearInterval(countdownRef.current);
                }

                setCrashWarning(false);

                SirenService.stop().catch((error) => {
                  console.log('SIREN STOP ERROR:', error?.message || error);
                });
              }}
              style={styles.fullWidth}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 52,
  },

  greeting: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  sub: { color: COLORS.volunteer, fontSize: 12, marginTop: 2 },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  activeBanner: {
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },

  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  activeIcon: { fontSize: 24, marginRight: 10 },
  activeTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  activeSubtitle: { color: COLORS.textSub, fontSize: 12, marginBottom: 12 },

  activeActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },

  sosSection: { alignItems: 'center', paddingVertical: 32 },
  instruction: { color: COLORS.textSub, fontSize: 14, marginBottom: 28 },

  sosBtn: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.primaryDark,
    elevation: 10,
  },

  sosBtnActive: { backgroundColor: COLORS.danger, borderColor: '#7F0000' },

  sosBtnLabel: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },

  holdHint: { color: '#ffffff99', fontSize: 13, marginTop: 4 },
  crashNote: { color: COLORS.textMuted, fontSize: 12, marginTop: 18 },

  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  qa: { alignItems: 'center', flex: 1 },

  qaIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qaIconText: { fontSize: 22 },

  qaLabel: {
    color: COLORS.textSub,
    fontSize: 10,
    marginTop: 5,
    fontWeight: '600',
  },

  locationLabel: {
    color: COLORS.textSub,
    fontSize: 11,
    marginBottom: 3,
  },

  locationCoords: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  locationAccuracy: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  backdrop: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sheetTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },

  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  typeText: { color: COLORS.text, fontSize: 15 },
  typeArrow: { color: COLORS.textMuted, fontSize: 20 },

  cancelBtn: { marginTop: 12 },

  crashSheet: { alignItems: 'center' },
  crashIcon: { fontSize: 52, marginBottom: 10 },
  crashTitle: { color: COLORS.danger, fontSize: 22, fontWeight: '900' },
  crashCounter: {
    color: COLORS.text,
    fontSize: 52,
    fontWeight: '900',
    marginVertical: 8,
  },

  crashText: {
    color: COLORS.textSub,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },

  fullWidth: { width: '100%' },
});