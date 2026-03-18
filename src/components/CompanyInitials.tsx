import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCompanyColor, getInitials } from '../utils/helpers';

interface Props {
  name: string;
  size?: number;
}

export function CompanyInitials({ name, size = 44 }: Props) {
  const color = getCompanyColor(name);
  const initials = getInitials(name);

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
