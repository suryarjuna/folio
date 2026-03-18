import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { Colors, Radius, Spacing } from '../src/constants/theme';
import { Coupon, DiscountTypeLabels } from '../src/constants/types';
import { useThemeColors } from '../src/hooks/useColorScheme';
import { CompanyInitials } from '../src/components/CompanyInitials';
import { ExpiryChip } from '../src/components/ExpiryChip';
import { getCompanyColor, formatDate } from '../src/utils/helpers';
import * as db from '../src/db/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CouponDetailScreen() {
  const theme = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [copied, setCopied] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [imageFullScreen, setImageFullScreen] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCoupon = useCallback(async () => {
    if (!id) return;
    try {
      const data = await db.getCouponById(id);
      setCoupon(data);
    } catch (err) {
      console.error('Failed to load coupon:', err);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadCoupon();
    }, [loadCoupon])
  );

  // Clean up copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!coupon) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary }}>Coupon not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const copyCode = async () => {
    if (!coupon.code) return;
    await Clipboard.setStringAsync(coupon.code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkUsed = () => {
    Alert.alert(
      'Mark as Used?',
      `${coupon.discountDescription || 'This coupon'} at ${coupon.companyName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, archive it',
          onPress: async () => {
            await db.markAsUsed(coupon.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  const handleFavorite = async () => {
    const newVal = coupon.isFavorite !== 1;
    await db.toggleFavorite(coupon.id, newVal);
    setCoupon({ ...coupon, isFavorite: newVal ? 1 : 0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    const parts = [coupon.companyName];
    if (coupon.discountDescription) parts.push(coupon.discountDescription);
    if (coupon.code) parts.push(`Code: ${coupon.code}`);
    if (coupon.expiryDate) parts.push(`Expires: ${formatDate(coupon.expiryDate)}`);
    parts.push('Shared from Folio');

    await Share.share({ message: parts.join('\n') });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          {coupon.companyName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {coupon.couponImageUri && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setImageFullScreen(true)}
            accessibilityLabel="Coupon image. Tap to enlarge"
          >
            <Image
              source={{ uri: coupon.couponImageUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.tapHint}>
              <Ionicons name="expand-outline" size={14} color="#FFF" />
              <Text style={styles.tapHintText}>Tap to enlarge</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Company header */}
        <View style={styles.companyHeader}>
          <CompanyInitials name={coupon.companyName} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.companyName, { color: theme.text }]}>{coupon.companyName}</Text>
            <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>
              {DiscountTypeLabels[coupon.discountType]}
            </Text>
          </View>
        </View>

        {/* Big discount */}
        {coupon.discountDescription ? (
          <Text style={[styles.bigDiscount, { color: Colors.primary }]}>
            {coupon.discountDescription}
          </Text>
        ) : null}

        {/* Code block */}
        {coupon.code ? (
          <TouchableOpacity
            style={[styles.codeBlock, { backgroundColor: theme.surfaceSecondary }]}
            onPress={copyCode}
            activeOpacity={0.7}
            accessibilityLabel={`Promo code ${coupon.code}`}
            accessibilityHint="Double tap to copy code to clipboard"
          >
            <Text style={[styles.codeText, { color: theme.text }]}>{coupon.code}</Text>
            <View style={styles.copyRow}>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? Colors.primary : theme.textSecondary}
              />
              <Text style={{ color: copied ? Colors.primary : theme.textSecondary, fontSize: 13 }}>
                {copied ? 'Copied!' : 'Tap to copy'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.noCodeBlock, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              No code — just show this coupon
            </Text>
          </View>
        )}

        {/* Expiry */}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.text }]}>
            {coupon.expiryDate ? `Expires ${formatDate(coupon.expiryDate)}` : 'No expiry date'}
          </Text>
          <View style={{ flex: 1 }} />
          <ExpiryChip date={coupon.expiryDate} />
        </View>

        {/* Details */}
        {coupon.minimumPurchase !== null && coupon.minimumPurchase !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="cart-outline" size={18} color={theme.textSecondary} />
            <View>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Min. purchase</Text>
              <Text style={[styles.detailText, { color: theme.text }]}>
                ${coupon.minimumPurchase.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {coupon.websiteURL ? (
          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={18} color={theme.textSecondary} />
            <View>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Website</Text>
              <Text style={[styles.detailText, { color: Colors.primary }]}>{coupon.websiteURL}</Text>
            </View>
          </View>
        ) : null}

        {coupon.notes ? (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Notes</Text>
              <Text style={[styles.detailText, { color: theme.text }]}>{coupon.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Terms */}
        {coupon.terms ? (
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsExpanded(!termsExpanded)}
            accessibilityLabel={`Terms and conditions. ${termsExpanded ? 'Collapse' : 'Expand'}`}
          >
            <Text style={[styles.termsHeader, { color: theme.text }]}>Terms & Conditions</Text>
            <Ionicons
              name={termsExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
        {termsExpanded && coupon.terms ? (
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>{coupon.terms}</Text>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actionBar, { backgroundColor: theme.surface, borderTopColor: theme.surfaceSecondary }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleMarkUsed}
          accessibilityLabel="Mark as used"
          accessibilityHint="Archives this coupon as used"
        >
          <Ionicons name="checkmark-circle" size={22} color={Colors.blue} />
          <Text style={[styles.actionLabel, { color: Colors.blue }]}>Used</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          accessibilityLabel="Share coupon"
        >
          <Ionicons name="share-outline" size={22} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/edit-coupon', params: { id: coupon.id } })}
          accessibilityLabel="Edit coupon"
        >
          <Ionicons name="pencil" size={22} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFavorite}
          accessibilityLabel={coupon.isFavorite === 1 ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={coupon.isFavorite === 1 ? 'heart' : 'heart-outline'}
            size={22}
            color={coupon.isFavorite === 1 ? Colors.danger : theme.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              { color: coupon.isFavorite === 1 ? Colors.danger : theme.textSecondary },
            ]}
          >
            {coupon.isFavorite === 1 ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen image modal */}
      <Modal
        visible={imageFullScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setImageFullScreen(false)}
      >
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity
            style={styles.fullScreenClose}
            onPress={() => setImageFullScreen(false)}
            accessibilityLabel="Close full screen image"
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {coupon.couponImageUri && (
            <Image
              source={{ uri: coupon.couponImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, gap: 16, paddingTop: 8 },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.card,
  },
  tapHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00000060',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tapHintText: { color: '#FFF', fontSize: 11 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  companyName: { fontSize: 20, fontWeight: '700' },
  typeLabel: { fontSize: 13, marginTop: 2 },
  bigDiscount: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  codeBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: Radius.chip,
    gap: 6,
  },
  codeText: { fontSize: 22, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 2 },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noCodeBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.chip,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  detailLabel: { fontSize: 12 },
  detailText: { fontSize: 15 },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  termsHeader: { fontSize: 15, fontWeight: '600' },
  termsText: { fontSize: 13, lineHeight: 18 },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  actionButton: { flex: 1, alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 11, fontWeight: '500' },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#000000E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
  },
});
