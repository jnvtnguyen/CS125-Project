/*
  * Search Screen - Allows users to search for songs based on mood, time of day, and their preferences (found in settings.tsx).
*/
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { SelectField } from '@/components/select-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePreferences } from '@/hooks/use-preferences';
import { useThemeColor } from '@/hooks/use-theme-color';

// OPTIONS FOR SELECT FIELDS, TIME AND MOOD
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
  track_name: string;
  album_name: string;
  artists: string;
};

const MOCK_RESULTS: SearchResult[] = [
  {
    track_name: 'Mock Song 1',
    album_name: 'Mock Album 1',
    artists: 'Mock Artist 1',
  },
  {
    track_name: 'Mock Song 2',
    album_name: 'Mock Album 2',
    artists: 'Mock Artist 2',
  },
];

function SearchButton({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) {
  const backgroundColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({ light: '#ffffff', dark: '#151718' }, 'text');
  const loadingIndicatorColor = useThemeColor({ light: '#ffffff', dark: '#151718' }, 'text');

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={() => [
        styles.searchButton,
        { backgroundColor },
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
  const { favoriteArtists, favoriteGenres } = usePreferences();
  const [mood, setMood] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const resultCardBorderColor = useThemeColor({}, 'icon');
  const resultCardBackgroundColor = useThemeColor(
    { light: '#faf7f7', dark: '#202325' },
    'background'
  );

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
            favoriteGenres,
          },
        }),
      });
      const data = await response.json();
      setResults(data.results.length > 0 ? data.results : MOCK_RESULTS);
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
        {results.length > 0 ? (
          <ThemedView style={styles.resultsSection}>
            <ThemedText type="subtitle">Top 15 Songs</ThemedText>
            {results.map((song, index) => (
              <ThemedView
                key={`${song.track_name}-${song.album_name}-${index}`}
                style={[
                  styles.resultCard,
                  {
                    borderColor: resultCardBorderColor,
                    backgroundColor: resultCardBackgroundColor,
                  },
                ]}>
                <ThemedText type="defaultSemiBold">{`${index + 1}. ${song.track_name}`}</ThemedText>
                <ThemedText>{song.artists}</ThemedText>
                <ThemedText>{song.album_name}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        ) : null}
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
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  resultsSection: {
    gap: 12,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  noResultsTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});
