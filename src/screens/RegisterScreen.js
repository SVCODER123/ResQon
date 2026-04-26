import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { authAPI } from '../services/api';
import { AuthStore } from '../store/AuthStore';
import { COLORS } from '../constants';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNav } from '../navigation/Navigator';
import { validateEmail, validatePhone } from '../utils/helpers';

export function RegisterScreen() {
  const { goBack } = useNav();
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name     = 'Name is required';
    if (!validateEmail(form.email))     e.email    = 'Valid email required';
    if (!validatePhone(form.phone))     e.phone    = 'Valid 10-digit phone required';
    if (form.password.length < 6)       e.password = 'Min 6 characters';
    if (form.password !== form.confirm) e.confirm  = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(), password: form.password,
      });
      await AuthStore.setAuth(data.user, data.token);
    } catch (e) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Could not register');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>Create Account</Text>
        </View>
        <View style={styles.form}>
          <Input label="Full Name"        value={form.name}     onChangeText={v => set('name', v)}     placeholder="John Doe"          autoCapitalize="words" error={errors.name}     />
          <Input label="Email"            value={form.email}    onChangeText={v => set('email', v)}    placeholder="john@example.com"  keyboardType="email-address" error={errors.email} />
          <Input label="Phone"            value={form.phone}    onChangeText={v => set('phone', v)}    placeholder="9876543210"         keyboardType="phone-pad" error={errors.phone} />
          <Input label="Password"         value={form.password} onChangeText={v => set('password', v)} placeholder="Min 6 characters" secureTextEntry error={errors.password} />
          <Input label="Confirm Password" value={form.confirm}  onChangeText={v => set('confirm', v)}  placeholder="Repeat password"  secureTextEntry error={errors.confirm} />
          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={goBack}><Text style={styles.link}>Sign In</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: COLORS.bg },
  scroll:     { flexGrow: 1, padding: 24 },
  hero:       { alignItems: 'center', paddingVertical: 32 },
  logo:       { fontSize: 56 },
  title:      { color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  form:       { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  btn:        { marginTop: 8 },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.textSub, fontSize: 14 },
  link:       { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
