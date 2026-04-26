import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { authAPI } from '../services/api';
import { AuthStore } from '../store/AuthStore';
import { COLORS } from '../constants';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNav } from '../navigation/Navigator';

export function LoginScreen() {
  const { navigate, reset } = useNav();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email';
    }

    if (!trimmedPassword) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      console.log('LOGIN PAYLOAD:', {
        email: payload.email,
        passwordLength: payload.password.length,
      });

      const response = await authAPI.login(payload);

      console.log('LOGIN RESPONSE:', response?.data);

      const user = response?.data?.user;
      const token = response?.data?.token;

      if (!user || !token) {
        throw new Error('Invalid server response');
      }

      await AuthStore.setAuth(user, token);

      // Match routes that actually exist in App.js
      if (user.role === 'admin') {
        reset('AdminDashboard');
      } else {
        reset('Home');
      }
    } catch (e) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        'Invalid credentials';

      console.log('LOGIN ERROR:', e?.response?.data || e.message);

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>🚨</Text>
          <Text style={styles.appName}>ResQon</Text>
          <Text style={styles.tagline}>
            Emergency Response, Always Ready
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.btn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>

            <TouchableOpacity onPress={() => navigate('Register')}>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    fontSize: 64,
  },

  appName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },

  tagline: {
    color: COLORS.textSub,
    fontSize: 14,
    marginTop: 6,
  },

  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
  },

  btn: {
    marginTop: 8,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },

  footerText: {
    color: COLORS.textSub,
    fontSize: 14,
  },

  link: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});