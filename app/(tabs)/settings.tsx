import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors, Radius, Spacing } from '../../src/constants/theme';
import { SortOrder, SortOrderLabels } from '../../src/constants/types';
import { useThemeColors } from '../../src/hooks/useColorScheme';
import { CompanyInitials } from '../../src/components/CompanyInitials';
import { requestNotificationPermission, sendTestNotification } from '../../src/services/notificationService';
import { exportAllCoupons } from '../../src/services/exportService';

export default function SettingsScreen() {
  const theme = useThemeColors();
  const [nickname, setNickname] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyDays, setNotifyDays] = useState(3);
  const [defaultSort, setDefaultSort] = useState<SortOrder>('expiryAscending');
  const [showSortPicker, setShowSortPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('userNickname');
      if (name) setNickname(name);
      const notif = await AsyncStorage.getItem('notificationsEnabled');
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      const days = await AsyncStorage.getItem('notifyDaysBefore');
      if (days) setNotifyDays(parseInt(days, 10));
      const sort = await AsyncStorage.getItem('defaultSortOrder');
      if (sort) setDefaultSort(sort as SortOrder);
    })();
  }, []);

  const saveNickname = async (value: string) => {
    setNickname(value);
    await AsyncStorage.setItem('userNickname', value);
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in Settings to get expiry reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value.toString());
  };

  const changeNotifyDays = async (delta: number) => {
    const next = Math.max(1, Math.min(14, notifyDays + delta));
    setNotifyDays(next);
    await AsyncStorage.setItem('notifyDaysBefore', next.toString());
  };

  const changeSortOrder = async (order: SortOrder) => {
    setDefaultSort(order);
    setShowSortPicker(false);
    await AsyncStorage.setItem('defaultSortOrder', order);
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Permission Needed', 'Enable notifications in Settings first.');
      return;
    }
    await sendTestNotification();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Test Sent', 'You should receive a notification in 5 seconds.');
  };

  const handleExport = async () => {
    try {
      await exportAllCoupons();
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export coupons.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Profile */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Profile</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.profileRow}>
            <CompanyInitials name={nickname || 'U'} size={44} />
            <TextInput
              style={[styles.nicknameInput, { color: theme.text }]}
              value={nickname}
              onChangeText={saveNickname}
              placeholder="Nickname"
              placeholderTextColor={theme.textSecondary}
              maxLength={20}
            />
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Expiry reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          {notificationsEnabled && (
            <>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>
                  Remind {notifyDays} day{notifyDays > 1 ? 's' : ''} before
                </Text>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => changeNotifyDays(-1)} style={styles.stepperBtn}>
                    <Ionicons name="remove" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.stepperValue, { color: theme.text }]}>{notifyDays}</Text>
                  <TouchableOpacity onPress={() => changeNotifyDays(1)} style={styles.stepperBtn}>
                    <Ionicons name="add" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: Colors.primary + '15' }]}
                onPress={handleTestNotification}
              >
                <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
                <Text style={[styles.testButtonText, { color: Colors.primary }]}>
                  Send Test Notification
                </Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            Get notified before your coupons expire.
          </Text>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.row} onPress={() => setShowSortPicker(!showSortPicker)}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Default sort</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {SortOrderLabels[defaultSort]}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
          {showSortPicker &&
            (Object.keys(SortOrderLabels) as SortOrder[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.pickerItem, defaultSort === key && { backgroundColor: Colors.primary + '15' }]}
                onPress={() => changeSortOrder(key)}
              >
                <Text style={{ color: defaultSort === key ? Colors.primary : theme.text, fontSize: 14 }}>
                  {SortOrderLabels[key]}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* Data */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Data</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Export all coupons</Text>
            <Ionicons name="share-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, gap: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  card: {
    borderRadius: Radius.card,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  nicknameInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowLabel: { fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: Radius.small,
  },
  testButtonText: { fontSize: 14, fontWeight: '600' },
  footer: { fontSize: 12, paddingHorizontal: 12, paddingBottom: 8 },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginHorizontal: 4 },
});
