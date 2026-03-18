import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { Colors, Radius, Spacing } from '../src/constants/theme';
import { useThemeColors } from '../src/hooks/useColorScheme';

const sources = [
  {
    key: 'camera',
    icon: 'camera' as const,
    title: 'Camera',
    subtitle: 'Take a photo of your coupon',
    color: '#3B82F6',
  },
  {
    key: 'photoLibrary',
    icon: 'images' as const,
    title: 'Photo Library',
    subtitle: 'Choose from your photos',
    color: '#8B5CF6',
  },
  {
    key: 'manual',
    icon: 'create' as const,
    title: 'Manual Entry',
    subtitle: 'Type in the details yourself',
    color: Colors.primary,
  },
];

export default function AddCouponScreen() {
  const theme = useThemeColors();

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Access Needed',
        'Please allow camera access in Settings to scan coupons.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/processing',
        params: { imageUri: result.assets[0].uri, source: 'camera' },
      });
    }
  };

  const handlePhotoLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Access Needed',
        'Please allow photo library access in Settings to import coupons.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/processing',
        params: { imageUri: result.assets[0].uri, source: 'photoLibrary' },
      });
    }
  };

  const handleSource = (key: string) => {
    switch (key) {
      case 'camera':
        handleCamera();
        break;
      case 'photoLibrary':
        handlePhotoLibrary();
        break;
      case 'manual':
        router.push({ pathname: '/edit-coupon', params: { source: 'manual' } });
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Add a Coupon</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        How would you like to add your coupon?
      </Text>

      <View style={styles.sources}>
        {sources.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sourceCard, { backgroundColor: theme.surface }]}
            onPress={() => handleSource(s.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: s.color + '18' }]}>
              <Ionicons name={s.icon} size={24} color={s.color} />
            </View>
            <View style={styles.sourceText}>
              <Text style={[styles.sourceTitle, { color: theme.text }]}>{s.title}</Text>
              <Text style={[styles.sourceSubtitle, { color: theme.textSecondary }]}>{s.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary + '60'} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-start', padding: Spacing.lg },
  cancelText: { fontSize: 16 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  sources: { paddingHorizontal: Spacing.xl, gap: 12 },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.card,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceText: { flex: 1, gap: 2 },
  sourceTitle: { fontSize: 16, fontWeight: '600' },
  sourceSubtitle: { fontSize: 12 },
});
