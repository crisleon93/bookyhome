import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WHITE = '#FFFFFF';
const BORDER = '#e5e7eb';
const TEXT = '#1f2937';
const MUTED = '#6b7280';

export default function DiscountTypeSelector({
  options,
  selectedType,
  onSelect,
  accentColor,
  labelMarginLeft = 12,
}) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = selectedType === option.tipo;
        return (
          <TouchableOpacity
            key={option.tipo}
            style={[
              styles.card,
              selected && {
                borderColor: accentColor,
                backgroundColor: `${accentColor}08`,
              },
            ]}
            onPress={() => onSelect(option.tipo)}
            activeOpacity={0.7}
          >
            <View style={[styles.icon, { backgroundColor: option.bg }]}>
              <Text style={styles.iconText}>{option.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: labelMarginLeft }}>
              <Text style={[styles.label, selected && { color: accentColor }]}>
                {option.label}
              </Text>
              <Text style={styles.description}>{option.desc}</Text>
            </View>
            {selected && (
              <View style={[styles.check, { backgroundColor: accentColor }]}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  description: { fontSize: 12, color: MUTED },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: WHITE, fontSize: 11, fontWeight: '900' },
});
