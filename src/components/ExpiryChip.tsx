import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { daysUntil, getExpiryUrgency, formatDate } from '../utils/helpers';

interface Props {
  date: string | null;
}

const urgencyColors: Record<string, string> = {
  safe: Colors.primary,
  warning: Colors.accent,
  urgent: Colors.danger,
  expired: '#9CA3AF',
  none: '#9CA3AF',
};

export function ExpiryChip({ date }: Props) {
  const urgency = getExpiryUrgency(date);
  const days = daysUntil(date);
  const color = urgencyColors[urgency];
  const isFilled = urgency === 'warning' || urgency === 'urgent';

  let label: string;
  if (days === null) {
    label = 'No expiry';
  } else if (days < 0) {
    label = 'Expired';
  } else if (days === 0) {
    label = 'Today';
  } else if (days === 1) {
    label = '1 day left';
  } else {
    label = `${days}d left`;
  }

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: isFilled ? color : color + '20',
        },
      ]}
      accessibilityLabel={date ? `Expires ${formatDate(date)}` : 'No expiry date'}
    >
      <Text
        style={[
          styles.text,
          { color: isFilled ? '#FFF' : color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
