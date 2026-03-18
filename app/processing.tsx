import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius } from '../src/constants/theme';
import { useThemeColors } from '../src/hooks/useColorScheme';
import { recognizeAndExtract } from '../src/services/ocrService';
import { saveCouponImage } from '../src/services/imageService';
import { uuid } from '../src/utils/helpers';

export default function ProcessingScreen() {
  const theme = useThemeColors();
  const { imageUri, source } = useLocalSearchParams<{ imageUri: string; source: string }>();
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Animated scan line
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // Scan line animation
    scanAnimRef.current = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    scanAnimRef.current.start();

    // Pulse animation
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimRef.current.start();

    return () => {
      mountedRef.current = false;
      scanAnimRef.current?.stop();
      pulseAnimRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!imageUri) {
      setError('No image provided');
      return;
    }
    processImage();
  }, [imageUri]);

  const processImage = async () => {
    try {
      if (!mountedRef.current) return;
      setError(null);

      const result = await recognizeAndExtract(imageUri!);
      if (!mountedRef.current) return;

      const couponId = uuid();
      const { imageUri: savedImage, thumbnailUri } = await saveCouponImage(imageUri!, couponId);
      if (!mountedRef.current) return;

      router.replace({
        pathname: '/edit-coupon',
        params: {
          source: source || 'camera',
          prefillCouponId: couponId,
          prefillImageUri: savedImage,
          prefillThumbnailUri: thumbnailUri,
          prefillCompanyName: result.companyName || '',
          prefillCode: result.code || '',
          prefillDiscountDescription: result.discountDescription || '',
          prefillDiscountValue: result.discountValue?.toString() || '',
          prefillDiscountType: result.discountType,
          prefillExpiryDate: result.expiryDate?.toISOString() || '',
          prefillMinimumPurchase: result.minimumPurchase?.toString() || '',
          prefillWebsiteURL: result.websiteURL || '',
          prefillTerms: result.terms || '',
          prefillConfidence: result.confidence.toString(),
        },
      });
    } catch (err) {
      console.error('OCR processing error:', err);
      if (mountedRef.current) {
        setError('Failed to read the coupon. Please try again or enter details manually.');
      }
    }
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <View style={[styles.errorIcon, { backgroundColor: Colors.danger + '15' }]}>
            <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Couldn't Read Coupon</Text>
          <Text style={[styles.errorSubtitle, { color: theme.textSecondary }]}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors.primary }]}
              onPress={processImage}
              accessibilityLabel="Try scanning again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.manualButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() =>
                router.replace({
                  pathname: '/edit-coupon',
                  params: { source: source || 'manual' },
                })
              }
              accessibilityLabel="Enter coupon details manually"
            >
              <Text style={[styles.manualText, { color: theme.text }]}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        {/* Image preview with scan effect */}
        <Animated.View style={[styles.imageWrapper, { transform: [{ scale: pulseAnim }] }]}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          )}
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]}
          />
        </Animated.View>

        <Text style={[styles.loadingTitle, { color: theme.text }]}>Reading your coupon...</Text>
        <Text style={[styles.loadingSubtitle, { color: theme.textSecondary }]}>
          Extracting text and details
        </Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <AnimatedDot key={i} delay={i * 300} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    );
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: Colors.primary, opacity }]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  imageWrapper: {
    width: 220,
    height: 220,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: '#0002',
  },
  previewImage: { width: '100%', height: '100%' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  loadingSubtitle: { fontSize: 15, marginBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  errorSubtitle: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  errorActions: { gap: 12, width: '100%' },
  retryButton: { paddingVertical: 14, borderRadius: Radius.button, alignItems: 'center' },
  retryText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  manualButton: { paddingVertical: 14, borderRadius: Radius.button, alignItems: 'center' },
  manualText: { fontSize: 16, fontWeight: '600' },
});
