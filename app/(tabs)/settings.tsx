import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MultiSelect, type IMultiSelectRef } from 'react-native-element-dropdown';

import { ARTIST_OPTIONS, GENRE_OPTIONS } from '@/assets/data/spotify-preferences';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePreferences } from '@/hooks/use-preferences';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const { favoriteArtists, favoriteGenres, setFavoriteArtists, setFavoriteGenres } =
    usePreferences();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.description}>
          Choose your favorite artists and genres to personalize your experience.
        </ThemedText>

        <MultiSelectField
          label="Favorite Artists"
          placeholder="Select Artists"
          options={ARTIST_OPTIONS}
          selected={favoriteArtists}
          onChange={setFavoriteArtists}
        />

        <MultiSelectField
          label="Favorite Genres"
          placeholder="Select Genres"
          options={GENRE_OPTIONS}
          selected={favoriteGenres}
          onChange={setFavoriteGenres}
        />
      </ScrollView>
    </ThemedView>
  );
}

type MultiSelectFieldProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
};

function MultiSelectField({
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
        selectedTextProps={{ numberOfLines: 1 }}
        alwaysRenderSelectedItem
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 48
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 20,
  },
  description: {
    marginTop: 8,
  },
  section: {
    gap: 12,
  },
  helper: {
    fontSize: 14,
    opacity: 0.7,
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
