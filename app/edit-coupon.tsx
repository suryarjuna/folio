import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius, Spacing, PresetCategories } from '../src/constants/theme';
import { Coupon, DiscountType, DiscountTypeLabels } from '../src/constants/types';
import { useThemeColors } from '../src/hooks/useColorScheme';
import { CompanyInitials } from '../src/components/CompanyInitials';
import { uuid } from '../src/utils/helpers';
import * as db from '../src/db/database';
import { scheduleExpiryNotifications } from '../src/services/notificationService';
import { checkForDuplicate } from '../src/services/duplicateDetection';

const discountTypes: DiscountType[] = ['percentage', 'fixedAmount', 'bogo', 'freeShipping', 'other'];

type EditParams = {
  id?: string;
  source?: string;
  prefillCouponId?: string;
  prefillImageUri?: string;
  prefillThumbnailUri?: string;
  prefillCompanyName?: string;
  prefillCode?: string;
  prefillDiscountDescription?: string;
  prefillDiscountValue?: string;
  prefillDiscountType?: string;
  prefillExpiryDate?: string;
  prefillMinimumPurchase?: string;
  prefillWebsiteURL?: string;
  prefillTerms?: string;
  prefillConfidence?: string;
};

export default function EditCouponScreen() {
  const theme = useThemeColors();
  const params = useLocalSearchParams<EditParams>();
  const isEditing = !!params.id;

  const [companyName, setCompanyName] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('other');
  const [code, setCode] = useState('');
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [minimumPurchase, setMinimumPurchase] = useState('');
  const [notes, setNotes] = useState('');
  const [websiteURL, setWebsiteURL] = useState('');
  const [terms, setTerms] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [customTag, setCustomTag] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);

  // Load existing coupon data when editing
  useEffect(() => {
    if (params.id) {
      (async () => {
        const coupon = await db.getCouponById(params.id!);
        if (coupon) {
          setCompanyName(coupon.companyName);
          setDiscountDescription(coupon.discountDescription);
          setDiscountValue(coupon.discountValue?.toString() ?? '');
          setDiscountType(coupon.discountType);
          setCode(coupon.code ?? '');
          setHasExpiry(!!coupon.expiryDate);
          if (coupon.expiryDate) setExpiryDate(new Date(coupon.expiryDate));
          setMinimumPurchase(coupon.minimumPurchase?.toString() ?? '');
          setNotes(coupon.notes ?? '');
          setWebsiteURL(coupon.websiteURL ?? '');
          setTerms(coupon.terms ?? '');
          setSelectedCategories(new Set(JSON.parse(coupon.categories || '[]')));
          setImageUri(coupon.couponImageUri);
          setThumbnailUri(coupon.thumbnailUri);
        }
      })();
    }
  }, [params.id]);

  // Pre-fill from OCR results
  useEffect(() => {
    if (params.prefillCompanyName) setCompanyName(params.prefillCompanyName);
    if (params.prefillCode) setCode(params.prefillCode);
    if (params.prefillDiscountDescription) setDiscountDescription(params.prefillDiscountDescription);
    if (params.prefillDiscountValue) setDiscountValue(params.prefillDiscountValue);
    if (params.prefillDiscountType) setDiscountType(params.prefillDiscountType as DiscountType);
    if (params.prefillExpiryDate) {
      const d = new Date(params.prefillExpiryDate);
      if (!isNaN(d.getTime())) {
        setHasExpiry(true);
        setExpiryDate(d);
      }
    }
    if (params.prefillMinimumPurchase) setMinimumPurchase(params.prefillMinimumPurchase);
    if (params.prefillWebsiteURL) setWebsiteURL(params.prefillWebsiteURL);
    if (params.prefillTerms) setTerms(params.prefillTerms);
    if (params.prefillImageUri) setImageUri(params.prefillImageUri);
    if (params.prefillThumbnailUri) setThumbnailUri(params.prefillThumbnailUri);
    if (params.prefillCouponId) setCouponId(params.prefillCouponId);
    if (params.prefillConfidence) {
      const conf = parseFloat(params.prefillConfidence);
      if (conf < 0.7) setLowConfidence(true);
    }
  }, []);

  const toggleCategory = (cat: string) => {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCategories(next);
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    setSelectedCategories(new Set([...selectedCategories, trimmed]));
    setCustomTag('');
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setExpiryDate(selectedDate);
  };

  const handleSave = async (forceArchive = false, skipDuplicateCheck = false) => {
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      Alert.alert('Missing Info', 'Company name is required.');
      return;
    }

    const finalExpiry = hasExpiry ? expiryDate.toISOString() : null;

    // Past expiry check
    if (!forceArchive && finalExpiry && new Date(finalExpiry) < new Date()) {
      Alert.alert(
        'Coupon Already Expired',
        "This coupon's expiry date is in the past. Save it to your archive?",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save to Archive', onPress: () => handleSave(true) },
        ]
      );
      return;
    }

    // Duplicate detection (only for new coupons)
    if (!isEditing && !skipDuplicateCheck) {
      const { isDuplicate, existingCoupon } = await checkForDuplicate(
        trimmedName,
        code || null,
        finalExpiry
      );
      if (isDuplicate && existingCoupon) {
        Alert.alert(
          'Possible Duplicate',
          `You already have a ${existingCoupon.companyName} coupon. Add anyway?`,
          [
            { text: 'View Existing', onPress: () => router.replace({ pathname: '/coupon-detail', params: { id: existingCoupon.id } }) },
            { text: 'Add Anyway', onPress: () => handleSave(forceArchive, true) },
          ]
        );
        return;
      }
    }

    const coupon: Coupon = {
      id: params.id ?? couponId ?? uuid(),
      companyName: trimmedName,
      couponImageUri: imageUri,
      thumbnailUri: thumbnailUri,
      code: code || null,
      discountDescription,
      discountValue: discountValue ? parseFloat(discountValue) : null,
      discountType,
      expiryDate: finalExpiry,
      minimumPurchase: minimumPurchase ? parseFloat(minimumPurchase) : null,
      categories: JSON.stringify(Array.from(selectedCategories)),
      notes: notes || null,
      source: (params.source as Coupon['source']) ?? 'manual',
      isFavorite: 0,
      status: forceArchive ? 'expired' : 'active',
      archivedDate: forceArchive ? new Date().toISOString() : null,
      usedDate: null,
      barcodeValue: null,
      barcodeType: null,
      websiteURL: websiteURL || null,
      terms: terms || null,
      createdAt: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        await db.updateCoupon(coupon);
      } else {
        await db.insertCoupon(coupon);
      }
    } catch (err) {
      console.error('Failed to save coupon:', err);
      Alert.alert('Save Failed', 'Could not save the coupon. Please try again.');
      return;
    }

    // Schedule expiry notifications (non-blocking)
    if (coupon.status === 'active' && coupon.expiryDate) {
      scheduleExpiryNotifications(coupon).catch((err) => {
        console.warn('Failed to schedule notification:', err);
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    if (router.canGoBack()) router.back(); // dismiss add-coupon modal too
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isEditing ? 'Edit Coupon' : 'Add Coupon'}
        </Text>
        <TouchableOpacity onPress={() => handleSave()} disabled={!companyName.trim()}>
          <Text
            style={[
              styles.saveText,
              { color: companyName.trim() ? Colors.primary : theme.textSecondary },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Low confidence banner */}
        {lowConfidence && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={18} color={Colors.accent} />
            <Text style={styles.warningText}>
              We couldn't read everything — please fill in any missing details.
            </Text>
          </View>
        )}

        {/* Image preview */}
        {imageUri && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Photo</Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            </View>
          </>
        )}

        {/* Company */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Company</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.companyRow}>
            {companyName.trim() ? <CompanyInitials name={companyName} size={36} /> : null}
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Company / Brand name"
              placeholderTextColor={theme.textSecondary}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>
        </View>

        {/* Discount */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Discount</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="e.g. 20% off, $10 off orders $50+"
            placeholderTextColor={theme.textSecondary}
            value={discountDescription}
            onChangeText={setDiscountDescription}
          />
          <View style={styles.typeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeChips}>
                {discountTypes.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      { backgroundColor: discountType === t ? Colors.primary : theme.surfaceSecondary },
                    ]}
                    onPress={() => setDiscountType(t)}
                  >
                    <Text style={{ color: discountType === t ? '#FFF' : theme.text, fontSize: 13 }}>
                      {DiscountTypeLabels[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.twoCol}>
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Value"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={discountValue}
              onChangeText={setDiscountValue}
            />
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Min. purchase"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={minimumPurchase}
              onChangeText={setMinimumPurchase}
            />
          </View>
        </View>

        {/* Code */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Promo Code</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Code (optional)"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
        </View>

        {/* Expiry */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Expiry</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Has expiry date</Text>
            <Switch value={hasExpiry} onValueChange={setHasExpiry} trackColor={{ true: Colors.primary }} />
          </View>
          {hasExpiry && (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>
                {expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          {hasExpiry && showDatePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2030, 11, 31)}
              accentColor={Colors.primary}
            />
          )}
        </View>

        {/* Categories */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Categories</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.tagWrap}>
            {[...PresetCategories].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selectedCategories.has(cat) ? Colors.primary : theme.surfaceSecondary,
                  },
                ]}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={{ color: selectedCategories.has(cat) ? '#FFF' : theme.text, fontSize: 13 }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customTagRow}>
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Add custom tag"
              placeholderTextColor={theme.textSecondary}
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={addCustomTag} disabled={!customTag.trim()}>
              <Text style={{ color: customTag.trim() ? Colors.primary : theme.textSecondary, fontWeight: '600' }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Details (Optional)</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Notes"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Website URL"
            placeholderTextColor={theme.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
            value={websiteURL}
            onChangeText={setWebsiteURL}
          />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Terms & conditions"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            value={terms}
            onChangeText={setTerms}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
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
    paddingVertical: 12,
  },
  cancelText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveText: { fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, gap: 4 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '18',
    padding: 12,
    borderRadius: Radius.chip,
    marginBottom: 4,
  },
  warningText: {
    flex: 1,
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.chip,
  },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  card: {
    borderRadius: Radius.card,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { fontSize: 15, paddingVertical: 6 },
  typeRow: { marginTop: 4 },
  typeChips: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  twoCol: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.small,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  customTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
