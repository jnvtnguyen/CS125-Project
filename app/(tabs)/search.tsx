import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { SelectField } from '@/components/select-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePreferences } from '@/hooks/use-preferences';
import { useThemeColor } from '@/hooks/use-theme-color';

const MOOD_OPTIONS = [
  { label: 'Energetic', value: 'energetic' },
  { label: 'Melancholic', value: 'melancholic' },
  { label: 'Calm', value: 'calm' },
  { label: 'Intense', value: 'intense' },
  { label: 'Happy', value: 'happy' },
  { label: 'Focused', value: 'focused' },
  { label: 'Party', value: 'party' },
  { label: 'Romantic', value: 'romantic' },
];

const TIME_OPTIONS = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Night', value: 'night' },
];

type SearchResult = {
  trackName: string;
  albumName: string;
  artists: string;
};

function SearchButton({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) {
  const backgroundColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({ light: '#FFFFFF', dark: '#151718' }, 'text');
  const loadingIndicatorColor = useThemeColor({ light: '#FFFFFF', dark: '#151718' }, 'text');

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.searchButton,
        { backgroundColor },
        pressed && !isLoading ? styles.searchButtonPressed : null,
        isLoading ? styles.searchButtonDisabled : null,
      ]}>
      {isLoading ? (
        <ActivityIndicator color={loadingIndicatorColor} />
      ) : (
        <ThemedText style={[styles.searchButtonText, { color: buttonTextColor }]}>
          Search
        </ThemedText>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
  const [mood, setMood] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { favoriteArtists, favoriteGenres } = usePreferences();

  const onSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          time,
          settings: {
            favoriteArtists,
            favoriteGenres
          }
        }),
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Search</ThemedText>
        <SelectField
          label="Mood"
          placeholder="Select Mood"
          options={MOOD_OPTIONS.map((option) => option.label)}
          selected={mood}
          onChange={setMood}
        />
        <SelectField
          label="Time of Day"
          placeholder="Select Time"
          options={TIME_OPTIONS.map((option) => option.label)}
          selected={time}
          onChange={setTime}
        />
        <SearchButton onPress={onSearch} isLoading={loading} />
      </ScrollView>
    </ThemedView>
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
  searchButton: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchButtonPressed: {
    opacity: 0.88,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});
