import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationProvider, useNav } from './navigation/Navigator';
import { AuthStore } from './store/AuthStore';
import { SOSStore } from './store/SOSStore';
import { SirenService } from './services/SirenService';
import { COLORS } from './constants';

import { LoginScreen }               from './screens/LoginScreen';
import { RegisterScreen }            from './screens/RegisterScreen';
import { HomeScreen }                from './screens/HomeScreen';
import { SOSActiveScreen }           from './screens/SOSActiveScreen';
import { MapScreen }                 from './screens/MapScreen';
import { IncidentsScreen }           from './screens/IncidentsScreen';
import { IncidentDetailScreen }      from './screens/IncidentDetailScreen';
import { EvidenceScreen }            from './screens/EvidenceScreen';
import { VolunteersScreen }          from './screens/VolunteersScreen';
import { ProfileScreen }             from './screens/ProfileScreen';
import { AdminDashboardScreen }      from './screens/AdminDashboardScreen';
import { AdminIncidentDetailScreen } from './screens/AdminIncidentDetailScreen';

function AppScreens() {
  const { current } = useNav();

  const [auth, setAuth] = useState({
    user: AuthStore.getUser(),
    token: AuthStore.getToken(),
    ready: AuthStore.isReady ? AuthStore.isReady() : false,
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = AuthStore.subscribe(({ user, token, isReady }) => {
      if (!mounted) return;

      setAuth({
        user,
        token,
        ready: typeof isReady === 'boolean'
          ? isReady
          : (AuthStore.isReady ? AuthStore.isReady() : true),
      });
    });

    (async () => {
      try {
        await AuthStore.init();
        await SOSStore.init();
        await SirenService.init();

        if (mounted) {
          setAuth({
            user: AuthStore.getUser(),
            token: AuthStore.getToken(),
            ready: AuthStore.isReady ? AuthStore.isReady() : true,
          });
        }
      } catch (error) {
        console.log('App init error:', error);

        if (mounted) {
          setAuth({
            user: AuthStore.getUser(),
            token: AuthStore.getToken(),
            ready: true,
          });
        }
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (!auth.ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // Auth gate
  if (!auth.token) {
    if (current.name === 'Register') return <RegisterScreen route={current} />;
    return <LoginScreen route={current} />;
  }

  const role = auth.user?.role;
  const isAdmin = role === 'admin';
  const isVolunteer = role === 'volunteer';

  // Admin screens
  if (isAdmin) {
    if (current.name === 'AdminIncidentDetail') return <AdminIncidentDetailScreen route={current} />;
    if (current.name === 'Map') return <MapScreen route={current} />;
    if (current.name === 'Profile') return <ProfileScreen route={current} />;
    if (current.name === 'Evidence') return <EvidenceScreen route={current} />;
    return <AdminDashboardScreen route={current} />;
  }

  // Volunteer screens
  if (isVolunteer) {
    if (current.name === 'SOSActive') return <SOSActiveScreen route={current} />;
    if (current.name === 'Map') return <MapScreen route={current} />;
    if (current.name === 'Incidents') return <IncidentsScreen route={current} />;
    if (current.name === 'IncidentDetail') return <IncidentDetailScreen route={current} />;
    if (current.name === 'Evidence') return <EvidenceScreen route={current} />;
    if (current.name === 'Volunteers') return <VolunteersScreen route={current} />;
    if (current.name === 'Profile') return <ProfileScreen route={current} />;
    return <HomeScreen route={current} />;
  }

  // User screens
  if (current.name === 'SOSActive') return <SOSActiveScreen route={current} />;
  if (current.name === 'Map') return <MapScreen route={current} />;
  if (current.name === 'Incidents') return <IncidentsScreen route={current} />;
  if (current.name === 'IncidentDetail') return <IncidentDetailScreen route={current} />;
  if (current.name === 'Evidence') return <EvidenceScreen route={current} />;
  if (current.name === 'Volunteers') return <VolunteersScreen route={current} />;
  if (current.name === 'Profile') return <ProfileScreen route={current} />;
  return <HomeScreen route={current} />;
}

export default function App() {
  return (
    <NavigationProvider>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <AppScreens />
    </NavigationProvider>
  );
}