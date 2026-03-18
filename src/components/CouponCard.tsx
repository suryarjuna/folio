import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Coupon } from '../constants/types';
import { Colors, Radius } from '../constants/theme';
import { getCompanyColor } from '../utils/helpers';
import { CompanyInitials } from './CompanyInitials';
import { ExpiryChip } from './ExpiryChip';
import { useThemeColors } from '../hooks/useColorScheme';

interface Props {
  coupon: Coupon;
  onPress: () => void;
  muted?: boolean;
}

export const CouponCard = memo(function CouponCard({ coupon, onPress, muted = false }: Props) {
  const theme = useThemeColors();
  const stripeColor = getCompanyColor(coupon.companyName);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, opacity: muted ? 0.65 : 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${coupon.companyName}, ${coupon.discountDescription || 'coupon'}`}
      accessibilityHint="Tap to view details"
      accessibilityRole="button"
    >
      {/* Left stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]}>
        <CompanyInitials name={coupon.companyName} size={36} />
      </View>

      {/* Perforation */}
      <View style={[styles.perforation, { backgroundColor: stripeColor + '40' }]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: theme.background }]} />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.company, { color: theme.text }]} numberOfLines={1}>
            {coupon.companyName}
          </Text>
          {coupon.isFavorite === 1 && (
            <Ionicons name="star" size={14} color={Colors.accent} />
          )}
        </View>

        {coupon.discountDescription ? (
          <Text style={[styles.discount, { color: theme.textSecondary }]} numberOfLines={1}>
            {coupon.discountDescription}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          {coupon.code ? (
            <View style={[styles.codeChip, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.codeText, { color: theme.text }]}>{coupon.code}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <ExpiryChip date={coupon.expiryDate} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 88,
  },
  stripe: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perforation: {
    width: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  company: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  discount: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
