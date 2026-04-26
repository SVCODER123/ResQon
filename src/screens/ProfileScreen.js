import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal
} from 'react-native';
import { COLORS } from '../constants';
import { AuthStore } from '../store/AuthStore';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNav } from '../navigation/Navigator';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { getInitials, validatePhone } from '../utils/helpers';

export function ProfileScreen() {
  const { user } = useAuth();
  const { goBack, navigate } = useNav();   // ✅ Added navigate

  const [contacts, setContacts] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await userAPI.getContacts();
      setContacts(data.data || []);
    } catch (_) {}
  };

  const handleAddContact = async () => {
    const e = {};

    if (!newContact.name.trim())
      e.name = 'Name required';

    if (!validatePhone(newContact.phone))
      e.phone = 'Valid phone required';

    setErrors(e);

    if (Object.keys(e).length) return;

    setAddLoading(true);

    try {
      await userAPI.addContact(newContact);
      setAddModal(false);
      setNewContact({ name: '', phone: '' });
      loadContacts();
    } catch (ex) {
      Alert.alert(
        'Error',
        ex?.response?.data?.message || 'Could not add contact'
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveContact = (id, name) => {
    Alert.alert('Remove Contact', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await userAPI.removeContact(id);
          loadContacts();
        },
      },
    ]);
  };

  // ✅ Fixed Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthStore.logout();
          navigate('Login');   // ✅ Redirect to Login
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" onBack={() => goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar + Info */}
        <View style={styles.hero}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>
              {getInitials(user?.name || '')}
            </Text>
          </View>

          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.volunteerBadge}>
            <Text style={styles.volunteerText}>
              🛡️ Registered Volunteer
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <Card style={styles.section}>
          <InfoRow label="Phone" value={user?.phone || 'Not set'} />
          <InfoRow label="Role" value={user?.role || 'user'} />
          <InfoRow
            label="Joined"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN')
                : ''
            }
          />
        </Card>

        {/* Emergency Contacts */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🆘 Emergency Contacts ({contacts.length})
            </Text>

            <TouchableOpacity onPress={() => setAddModal(true)}>
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {!contacts.length ? (
            <Text style={styles.empty}>
              Add contacts to receive SOS SMS alerts
            </Text>
          ) : (
            contacts.map((c) => (
              <View key={c._id} style={styles.contactItem}>
                <View>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleRemoveContact(c._id, c.name)
                  }
                >
                  <Text style={styles.removeText}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Logout Button */}
        <Button
          title="🚪 Logout"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />

      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={addModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              Add Emergency Contact
            </Text>

            <Input
              label="Name"
              value={newContact.name}
              onChangeText={(v) =>
                setNewContact((p) => ({ ...p, name: v }))
              }
              placeholder="Contact name"
              autoCapitalize="words"
              error={errors.name}
            />

            <Input
              label="Phone"
              value={newContact.phone}
              onChangeText={(v) =>
                setNewContact((p) => ({ ...p, phone: v }))
              }
              placeholder="10-digit phone"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Button
              title="Add Contact"
              onPress={handleAddContact}
              loading={addLoading}
            />

            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setAddModal(false)}
              style={{ marginTop: 10 }}
            />

          </View>
        </View>
      </Modal>

    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 24 },

  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  bigAvatarText: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
  },

  name: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },

  email: {
    color: COLORS.textSub,
    fontSize: 14,
    marginTop: 4,
  },

  volunteerBadge: {
    backgroundColor: COLORS.volunteer + '22',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 10,
  },

  volunteerText: {
    color: COLORS.volunteer,
    fontSize: 12,
    fontWeight: '600',
  },

  section: { marginBottom: 16 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  addLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoLabel: {
    color: COLORS.textSub,
    fontSize: 13,
  },

  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  contactName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  contactPhone: {
    color: COLORS.textSub,
    fontSize: 12,
  },

  removeText: {
    color: COLORS.danger,
    fontSize: 12,
  },

  empty: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  logoutBtn: {
    borderColor: COLORS.danger,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
});