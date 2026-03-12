/*
 * Settings Screen - Allows users to select their favorite artists and genres, which will be used to personalize their experience in the Search screen.
 */
import { SpotifyAuth } from "@/app/spotify-auth";
import {
  ARTIST_OPTIONS,
  GENRE_OPTIONS,
} from "@/assets/data/spotify-preferences";
import { MultiSelectField } from "@/components/select-fields";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { usePreferences } from "@/hooks/use-preferences";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

export default function SettingsScreen() {
  const {
    favoriteArtists,
    favoriteGenres,
    setFavoriteArtists,
    setFavoriteGenres,
    setUserVector,
  } = usePreferences();

  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncSpotify = async () => {
    setIsSyncing(true);
    try {
      const token = await SpotifyAuth.get();
      const response = await fetch("/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }
      const {artists, genres, user_vector} =  await response.json();
      setFavoriteArtists(artists);
      setFavoriteGenres(genres);
      setUserVector(user_vector);

      Alert.alert("Success", "Your Spotify profile has been synced!");
    } catch (error) {
      Alert.alert("Error", "Failed to sync Spotify profile. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.description}>
          Choose your favorite artists and genres to personalize your
          experience.
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

      <ThemedView style={styles.footer}>
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncSpotify}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.syncButtonText}>Sync Spotify Profile</ThemedText>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await SpotifyAuth.clear();
            router.replace("/login");
          }}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 48,
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  syncButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ff4444",
    marginTop: 12,
  },
  logoutButtonText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
