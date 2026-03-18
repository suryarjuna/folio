import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Radius, Spacing } from '../../src/constants/theme';
import { Coupon } from '../../src/constants/types';
import { useThemeColors } from '../../src/hooks/useColorScheme';
import { CouponCard } from '../../src/components/CouponCard';
import { EmptyState } from '../../src/components/EmptyState';
import * as db from '../../src/db/database';

type Segment = 'used' | 'expired';

export default function ArchiveScreen() {
  const theme = useThemeColors();
  const [segment, setSegment] = useState<Segment>('used');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getArchivedCoupons(segment);
      setCoupons(data);
    } catch (err) {
      console.error('Failed to load archived coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useFocusEffect(
    useCallback(() => {
      loadCoupons();
    }, [loadCoupons])
  );

  const handleRestore = async (id: string) => {
    try {
      await db.restoreCoupon(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadCoupons();
    } catch (err) {
      console.error('Failed to restore coupon:', err);
      Alert.alert('Error', 'Could not restore the coupon.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Expired?',
      'This will permanently delete all expired coupons.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.clearExpiredCoupons();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              loadCoupons();
            } catch (err) {
              console.error('Failed to clear expired:', err);
              Alert.alert('Error', 'Could not clear expired coupons.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Archive</Text>
        {segment === 'expired' && coupons.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            accessibilityLabel="Clear all expired coupons"
            accessibilityRole="button"
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segment picker */}
      <View
        style={[styles.segmentContainer, { backgroundColor: theme.surfaceSecondary }]}
        accessibilityRole="tablist"
      >
        {(['used', 'expired'] as Segment[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.segmentButton,
              segment === s && { backgroundColor: theme.surface },
            ]}
            onPress={() => setSegment(s)}
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === s }}
            accessibilityLabel={s === 'used' ? 'Used coupons' : 'Expired coupons'}
          >
            <Text
              style={[
                styles.segmentText,
                { color: segment === s ? theme.text : theme.textSecondary },
              ]}
            >
              {s === 'used' ? 'Used' : 'Expired'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {coupons.length === 0 && !loading ? (
        <EmptyState
          icon={segment === 'used' ? 'checkmark-circle-outline' : 'time-outline'}
          title={segment === 'used' ? 'No used coupons' : 'No expired coupons'}
          subtitle={
            segment === 'used'
              ? 'Coupons you mark as used will appear here.'
              : 'Expired coupons will be automatically archived here.'
          }
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCoupons} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {coupons.map((coupon) => (
            <View key={coupon.id}>
              <View style={styles.cardWrapper}>
                <CouponCard
                  coupon={coupon}
                  onPress={() => router.push({ pathname: '/coupon-detail', params: { id: coupon.id } })}
                  muted
                />
                <View style={styles.archiveBadge}>
                  <Text style={styles.archiveBadgeText}>Archived</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.restoreButton, { backgroundColor: Colors.primary + '15' }]}
                onPress={() => handleRestore(coupon.id)}
                accessibilityLabel={`Restore ${coupon.companyName} coupon`}
                accessibilityRole="button"
              >
                <Text style={styles.restoreText}>Restore</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800' },
  clearText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.small,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: 12 },
  cardWrapper: { position: 'relative' },
  archiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  archiveBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  restoreButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  restoreText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});
