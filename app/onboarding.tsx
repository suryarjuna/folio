import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: 'wallet-outline' as const,
    title: 'Folio',
    subtitle: 'Your coupon wallet,\nbeautifully organized.',
    color: Colors.primary,
  },
  {
    icon: 'camera-outline' as const,
    title: 'Snap or Upload',
    subtitle: 'Take a photo of any coupon.\nWe read the details for you.',
    color: '#3B82F6',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Never Miss a Deal',
    subtitle: 'Get reminded before\nyour coupons expire.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [nickname, setNickname] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isLastPage = currentPage === pages.length;

  const goNext = () => {
    if (currentPage < pages.length) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1 });
      setCurrentPage(currentPage + 1);
    }
  };

  const finishOnboarding = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem('userNickname', trimmed);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)/wallet');
  };

  const renderPage = ({ item, index }: { item: (typeof pages)[number] | null; index: number }) => {
    if (index === pages.length) {
      // Nickname page
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.page}
        >
          <View style={styles.pageContent}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="person-circle-outline" size={72} color={Colors.primary} />
            </View>
            <Text style={styles.title}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your nickname"
              placeholderTextColor="#9CA3AF"
              value={nickname}
              onChangeText={setNickname}
              autoFocus={false}
              returnKeyType="done"
              onSubmitEditing={finishOnboarding}
              maxLength={20}
            />
            <TouchableOpacity
              style={[
                styles.startButton,
                { opacity: nickname.trim() ? 1 : 0.4 },
              ]}
              onPress={finishOnboarding}
              disabled={!nickname.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }

    return (
      <View style={styles.page}>
        <View style={styles.pageContent}>
          <View style={[styles.iconCircle, { backgroundColor: item!.color + '15' }]}>
            <Ionicons name={item!.icon} size={72} color={item!.color} />
          </View>
          <Text style={styles.title}>{item!.title}</Text>
          <Text style={styles.subtitle}>{item!.subtitle}</Text>
        </View>
      </View>
    );
  };

  const data = [...pages, null]; // null = nickname page

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderPage as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        keyExtractor={(_, i) => i.toString()}
      />

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {/* Dots */}
        <View style={styles.dots}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentPage ? Colors.primary : '#D1D5DB' },
              ]}
            />
          ))}
        </View>

        {!isLastPage && (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: pages.length });
                setCurrentPage(pages.length);
              }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    width: '100%',
    fontSize: 18,
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.card,
    color: '#111',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: Radius.card,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomBar: {
    paddingBottom: 48,
    paddingHorizontal: 32,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  nextButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
