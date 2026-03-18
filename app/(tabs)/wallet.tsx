import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, PresetCategories } from '../../src/constants/theme';
import { Coupon, SortOrder, SortOrderLabels } from '../../src/constants/types';
import { useThemeColors } from '../../src/hooks/useColorScheme';
import { CouponCard } from '../../src/components/CouponCard';
import { EmptyState } from '../../src/components/EmptyState';
import { CompanyInitials } from '../../src/components/CompanyInitials';
import * as db from '../../src/db/database';
import { daysUntil } from '../../src/utils/helpers';

export default function WalletScreen() {
  const theme = useThemeColors();
  const [nickname, setNickname] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('expiryAscending');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const [data, name] = await Promise.all([
        db.getActiveCoupons(sortOrder),
        AsyncStorage.getItem('userNickname'),
      ]);
      setCoupons(data);
      if (name) setNickname(name);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useFocusEffect(
    useCallback(() => {
      loadCoupons();
    }, [loadCoupons])
  );

  // Memoized filtered list
  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.companyName.toLowerCase().includes(q) ||
          (c.code?.toLowerCase().includes(q) ?? false) ||
          c.discountDescription.toLowerCase().includes(q) ||
          (c.notes?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      if (selectedCategory) {
        const cats: string[] = JSON.parse(c.categories || '[]');
        if (!cats.includes(selectedCategory)) return false;
      }
      return true;
    });
  }, [coupons, search, selectedCategory]);

  const favorites = useMemo(() => filtered.filter((c) => c.isFavorite === 1), [filtered]);
  const nonFavorites = useMemo(() => filtered.filter((c) => c.isFavorite !== 1), [filtered]);

  const expiringSoon = useMemo(() => {
    return coupons.filter((c) => {
      const days = daysUntil(c.expiryDate);
      return days !== null && days >= 0 && days <= 3;
    });
  }, [coupons]);

  // Memoized grouping
  const isGrouped = sortOrder === 'companyAZ' || sortOrder === 'companyZA';
  const grouped = useMemo<[string, Coupon[]][]>(() => {
    if (!isGrouped) return [];
    return Object.entries(
      nonFavorites.reduce<Record<string, Coupon[]>>((acc, c) => {
        (acc[c.companyName] = acc[c.companyName] || []).push(c);
        return acc;
      }, {})
    ).sort(([a], [b]) =>
      sortOrder === 'companyAZ' ? a.localeCompare(b) : b.localeCompare(a)
    );
  }, [nonFavorites, isGrouped, sortOrder]);

  const navigateToDetail = useCallback((id: string) => {
    router.push({ pathname: '/coupon-detail', params: { id } });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.text }]}>
          {nickname ? `Hi, ${nickname}` : 'Wallet'}
        </Text>
      </View>

      {/* Search */}
      <View
        style={[styles.searchBar, { backgroundColor: theme.surfaceSecondary }]}
        accessibilityRole="search"
      >
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search coupons..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search coupons"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon="wallet-outline"
          title="No coupons yet"
          subtitle="Start saving by adding your first coupon."
          buttonTitle="Add your first coupon"
          onPress={() => router.push('/add-coupon')}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCoupons} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Expiring soon banner */}
          {expiringSoon.length > 0 && !search && (
            <View style={[styles.expiringBanner, { backgroundColor: Colors.accent + '14' }]}>
              <View style={styles.expiringHeader}>
                <Ionicons name="flash" size={16} color={Colors.accent} />
                <Text style={[styles.expiringTitle, { color: Colors.accent }]}>Expiring soon</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.expiringChips}>
                  {expiringSoon.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.expiringChip, { backgroundColor: theme.surfaceSecondary }]}
                      onPress={() => navigateToDetail(c.id)}
                      accessibilityLabel={`${c.companyName}, expires in ${daysUntil(c.expiryDate)} days`}
                    >
                      <CompanyInitials name={c.companyName} size={22} />
                      <Text style={[styles.expiringChipText, { color: theme.text }]} numberOfLines={1}>
                        {c.companyName}
                      </Text>
                      <Text style={styles.expiringDays}>
                        {daysUntil(c.expiryDate)}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Sort & filter bar */}
          <View style={styles.sortBar}>
            <TouchableOpacity
              style={[styles.sortChip, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => setShowSortMenu(!showSortMenu)}
              accessibilityLabel={`Sort by ${SortOrderLabels[sortOrder]}. Tap to change.`}
              accessibilityRole="button"
            >
              <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} />
              <Text style={[styles.sortText, { color: theme.textSecondary }]}>
                {SortOrderLabels[sortOrder]}
              </Text>
            </TouchableOpacity>
          </View>

          {showSortMenu && (
            <View style={[styles.sortMenu, { backgroundColor: theme.surface }]}>
              {(Object.keys(SortOrderLabels) as SortOrder[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.sortMenuItem,
                    sortOrder === key && { backgroundColor: Colors.primary + '15' },
                  ]}
                  onPress={() => {
                    setSortOrder(key);
                    setShowSortMenu(false);
                  }}
                  accessibilityLabel={SortOrderLabels[key]}
                  accessibilityState={{ selected: sortOrder === key }}
                >
                  <Text
                    style={[
                      styles.sortMenuText,
                      { color: sortOrder === key ? Colors.primary : theme.text },
                    ]}
                  >
                    {SortOrderLabels[key]}
                  </Text>
                  {sortOrder === key && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryChips}>
              <TouchableOpacity
                style={[
                  styles.catChip,
                  { backgroundColor: !selectedCategory ? Colors.primary : theme.surfaceSecondary },
                ]}
                onPress={() => setSelectedCategory(null)}
                accessibilityLabel="Show all categories"
                accessibilityState={{ selected: !selectedCategory }}
              >
                <Text style={{ color: !selectedCategory ? '#FFF' : theme.text, fontSize: 13, fontWeight: '500' }}>
                  All
                </Text>
              </TouchableOpacity>
              {PresetCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    { backgroundColor: selectedCategory === cat ? Colors.primary : theme.surfaceSecondary },
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  accessibilityLabel={`Filter by ${cat}`}
                  accessibilityState={{ selected: selectedCategory === cat }}
                >
                  <Text
                    style={{
                      color: selectedCategory === cat ? '#FFF' : theme.text,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Favorites */}
          {favorites.length > 0 && !search && (
            <>
              <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                Favorites
              </Text>
              {favorites.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onPress={() => navigateToDetail(coupon.id)}
                />
              ))}
            </>
          )}

          {/* Main list */}
          {isGrouped
            ? grouped.map(([company, items]) => (
                <View key={company}>
                  <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                    {company}
                  </Text>
                  {items.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      onPress={() => navigateToDetail(coupon.id)}
                    />
                  ))}
                </View>
              ))
            : nonFavorites.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onPress={() => navigateToDetail(coupon.id)}
                />
              ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/add-coupon');
        }}
        activeOpacity={0.8}
        accessibilityLabel="Add coupon"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  greeting: { fontSize: 28, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.chip,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: 12 },
  expiringBanner: { padding: 12, borderRadius: Radius.chip, gap: 8 },
  expiringHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiringTitle: { fontSize: 13, fontWeight: '600' },
  expiringChips: { flexDirection: 'row', gap: 8 },
  expiringChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  expiringChipText: { fontSize: 12, fontWeight: '500', maxWidth: 80 },
  expiringDays: { fontSize: 11, fontWeight: '700', color: Colors.danger },
  sortBar: { flexDirection: 'row' },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  sortText: { fontSize: 12 },
  sortMenu: {
    borderRadius: Radius.chip,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sortMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  sortMenuText: { fontSize: 14 },
  categoryScroll: { flexGrow: 0 },
  categoryChips: { flexDirection: 'row', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
