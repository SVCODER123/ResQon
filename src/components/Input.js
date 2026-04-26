import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

export function Input({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  keyboardType = 'default', autoCapitalize = 'none', error, style, multiline = false,
}) {
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errBorder]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          style={[styles.input, multiline && styles.multiline]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn}>
            <Text style={styles.eye}>{secure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: COLORS.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  focused: { borderColor: COLORS.primary },
  errBorder: { borderColor: COLORS.danger },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 13 },
  multiline: { textAlignVertical: 'top', paddingTop: 12, minHeight: 90 },
  eyeBtn: { padding: 4 },
  eye: { fontSize: 18 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
});
