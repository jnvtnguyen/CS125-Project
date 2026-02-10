import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown, MultiSelect, type IMultiSelectRef } from 'react-native-element-dropdown';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type MultiSelectFieldProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
};

type SelectFieldProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string | null;
  onChange: (nextSelected: string) => void;
};

export function MultiSelectField({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectFieldProps) {
  const dropdownRef = useRef<IMultiSelectRef | null>(null);
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const data = useMemo(
    () => options.map((option) => ({ label: option, value: option })),
    [options]
  );

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <MultiSelect
        ref={dropdownRef}
        data={data}
        labelField="label"
        valueField="value"
        search
        placeholder={placeholder}
        searchPlaceholder="Search..."
        value={selected}
        onChange={(items) => {
          onChange(items as string[]);
          dropdownRef.current?.close();
        }}
        style={[styles.dropdown, { borderColor: iconColor, backgroundColor }]}
        placeholderStyle={[styles.placeholderText, { color: iconColor }]}
        selectedTextStyle={[styles.selectedText, { color: textColor }]}
        inputSearchStyle={[{ color: textColor, borderColor: iconColor }]}
        iconStyle={{ tintColor: iconColor }}
        containerStyle={[styles.dropdownMenu, { backgroundColor }]}
        activeColor={`${tintColor}22`}
        selectedStyle={{ borderColor: tintColor }}
        itemTextStyle={{ color: textColor }}
        selectedTextProps={{ numberOfLines: 1 }}
        alwaysRenderSelectedItem
      />
    </View>
  );
}

export function SelectField({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: SelectFieldProps) {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const data = useMemo(
    () => options.map((option) => ({ label: option, value: option })),
    [options]
  );

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{label}</ThemedText>
        <Dropdown
            data={data}
            labelField="label"
            valueField="value"
            placeholder={placeholder}
            value={selected}
            onChange={(item) => onChange(item.value)}
            style={[styles.dropdown, { borderColor: iconColor, backgroundColor }]}
            placeholderStyle={[styles.placeholderText, { color: iconColor }]}
            selectedTextStyle={[styles.selectedText, { color: textColor }]}
            iconStyle={{ tintColor: iconColor }}
            containerStyle={[styles.dropdownMenu, { backgroundColor }]}
            itemTextStyle={{ color: textColor }}
            activeColor={`${tintColor}22`}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  dropdown: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  dropdownMenu: {
    borderWidth: 1,
  },
  placeholderText: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 14,
  },
});
