/*
 * Search Screen - Allows users to search for songs based on mood, time of day, and their preferences (found in settings.tsx).

Times (from analysis.py):
    Morning (4am - 12pm)
    Afternoon (12pm - 6pm)
    Evening (6pm - 10pm)
    Night (10pm - 4am)
 */
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { SpotifyAuth } from "@/app/spotify-auth";

import { SelectField } from "@/components/select-fields";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { usePreferences } from "@/hooks/use-preferences";
import { useThemeColor } from "@/hooks/use-theme-color";

// OPTIONS FOR SELECT FIELDS, TIME AND MOOD
const MOOD_OPTIONS = [
  { label: "Energetic", value: "energetic" },
  { label: "Melancholic", value: "melancholic" },
  { label: "Calm", value: "calm" },
  { label: "Intense", value: "intense" },
  { label: "Happy", value: "happy" },
  { label: "Focused", value: "focused" },
  { label: "Party", value: "party" },
  { label: "Romantic", value: "romantic" },
];

function currentTimeOfDay(): string {
  const hour = new Date().getHours();
  console.log(hour);
  if (hour >= 4 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 20) return "evening";
  return "night";
}

type SearchResult = {
  track_name: string;
  album_name: string;
  artists: string;
  album_art: string | null;
  spotify_id: string;
  audio_vector: number[];
};

function SearchButton({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) {
  const backgroundColor = useThemeColor({}, "tint");
  const buttonTextColor = useThemeColor(
    { light: "#ffffff", dark: "#151718" },
    "text",
  );
  const loadingIndicatorColor = useThemeColor(
    { light: "#ffffff", dark: "#151718" },
    "text",
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={() => [
        styles.searchButton,
        { backgroundColor },
        isLoading ? styles.searchButtonDisabled : null,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={loadingIndicatorColor} />
      ) : (
        <ThemedText
          style={[styles.searchButtonText, { color: buttonTextColor }]}
        >
          Search
        </ThemedText>
      )}
    </Pressable>
  );
}

const LEARNING_RATE = 0.05;

function nudgeVector(userVector: number[], songVector: number[], liked: boolean): number[] {
  return userVector.map((val, i) => {
    const delta = songVector[i] - val;
    return liked ? val + LEARNING_RATE * delta : val - LEARNING_RATE * delta;
  });
}

export default function SearchScreen() {
  const { favoriteArtists, favoriteGenres, userVector, setUserVector } = usePreferences();
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const resultCardBorderColor = useThemeColor({}, "icon");
  const resultCardBackgroundColor = useThemeColor(
    { light: "#faf7f7", dark: "#202325" },
    "background",
  );

  const onFeedback = (liked: boolean) => {
    const song = results.find(s => s.spotify_id === selectedTrackId);
    if (!song) return;
    const updated = nudgeVector(userVector, song.audio_vector, liked);
    setUserVector(updated);
    setSelectedTrackId(null);
  };

  const onSearch = async () => {
    setSelectedTrackId(null);
    setLoading(true);
    try {
      const time = currentTimeOfDay();
      console.log("Current time: " + time);
      const token = await SpotifyAuth.get();
      const response = await fetch("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood,
          time,
          settings: {
            favoriteArtists,
            favoriteGenres,
            userVector,
          },
        }),
      });
      const data = await response.json();
      setResults(data.results ?? []);
    } catch (error) {
      console.error("Search Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Search</ThemedText>
        <SelectField
          label="Mood"
          placeholder="Select Mood"
          options={MOOD_OPTIONS.map((option) => option.label)}
          selected={mood}
          onChange={setMood}
        />
        <SearchButton onPress={onSearch} isLoading={loading} />
        {results.length > 0 ? (
          <ThemedView style={styles.resultsSection}>
            <ThemedText type="subtitle">Top 15 Songs</ThemedText>
            {results.map((song, index) => (
              <Pressable
                key={`${song.track_name}-${song.album_name}-${index}`}
                onPress={() => setSelectedTrackId(song.spotify_id)}
              >
                <ThemedView
                  style={[
                    styles.resultCard,
                    {
                      borderColor:
                        selectedTrackId === song.spotify_id
                          ? "#1DB954"
                          : resultCardBorderColor,
                      backgroundColor: resultCardBackgroundColor,
                      borderWidth: selectedTrackId === song.spotify_id ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.resultRow}>
                    {song.album_art ? (
                      <Image
                        source={{ uri: song.album_art }}
                        style={styles.albumArt}
                      />
                    ) : (
                      <View
                        style={[styles.albumArt, styles.albumArtPlaceholder]}
                      />
                    )}
                    <View style={styles.trackInfo}>
                      <ThemedText type="defaultSemiBold" numberOfLines={1}>
                        {`${index + 1}. ${song.track_name}`}
                      </ThemedText>
                      <ThemedText numberOfLines={1}>{song.artists}</ThemedText>
                      <ThemedText numberOfLines={1} style={styles.albumText}>
                        {song.album_name}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        ) : null}
      </ScrollView>

      {selectedTrackId ? (
  <View style={styles.playerContainer}>
    <WebView
      source={{
        uri: `https://open.spotify.com/embed/track/${selectedTrackId}?utm_source=generator&theme=0`,
      }}
      style={styles.player}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
    />
    <View style={styles.feedbackRow}>
      <TouchableOpacity style={styles.feedbackButton} onPress={() => onFeedback(true)}>
        <ThemedText style={styles.feedbackButtonText}>👍</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.feedbackButton} onPress={() => onFeedback(false)}>
        <ThemedText style={styles.feedbackButtonText}>👎</ThemedText>
      </TouchableOpacity>
    </View>
  </View>
) : null}
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
    paddingBottom: 200,
    paddingTop: 16,
    gap: 20,
  },
  searchButton: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  albumArtPlaceholder: {
    backgroundColor: "#333",
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  albumText: {
    fontSize: 12,
    opacity: 0.7,
  },
  playerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "#000",  
    paddingTop: 8,
    paddingBottom: 10,
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 75,
    paddingVertical: 0,
    backgroundColor: "#000",
    height: 50,
  },
  feedbackButton: {
    padding: 0,
  },
  feedbackButtonText: {
    fontSize: 18,
  },
  player: { 
    flex: 1,
    backgroundColor: "#000",
  },
  noResultsTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});