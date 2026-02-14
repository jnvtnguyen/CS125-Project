/*
  * Settings Screen - Allows users to select their favorite artists and genres, which will be used to personalize their experience in the Search screen.
*/
import { ScrollView, StyleSheet } from 'react-native';

import { ARTIST_OPTIONS, GENRE_OPTIONS } from '@/assets/data/spotify-preferences';
import { MultiSelectField } from '@/components/select-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePreferences } from '@/hooks/use-preferences';

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
});
