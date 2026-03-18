/*
 * Search Screen - Allows users to search for songs based on mood, time of day, and their preferences (found in settings.tsx).

Times (from analysis.py):
    Morning (4am - 12pm)
    Afternoon (12pm - 6pm)
    Evening (6pm - 10pm)
    Night (10pm - 4am)
 */
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import * as Haptics from "expo-haptics";

import { SpotifyAuth } from "@/app/spotify-auth";

import { SelectField } from "@/components/select-fields";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
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

function nudgeVector(
  userVector: number[],
  songVector: number[],
  liked: boolean,
): number[] {
  return userVector.map((val, i) => {
    const delta = songVector[i] - val;
    return liked ? val + LEARNING_RATE * delta : val - LEARNING_RATE * delta;
  });
}

function FeedbackButton({
  kind,
  onPress,
  disabled,
  pending,
}: {
  kind: "like" | "dislike";
  onPress: () => void;
  disabled: boolean;
  pending: boolean;
}) {
  const baseColor = kind === "like" ? "#1DB954" : "#FF3B30";
  const label = kind === "like" ? "Like" : "Dislike";
  const iconName = kind === "like" ? "hand.thumbsup.fill" : "hand.thumbsdown.fill";
  const iconColor = disabled ? "#8E8E93" : baseColor;
  const borderColor = pending ? baseColor : iconColor;
  const backgroundColor = pending ? `${baseColor}22` : "transparent";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.feedbackButton,
        {
          borderColor,
          backgroundColor,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
      ]}
    >
      <IconSymbol name={iconName} size={18} color={iconColor} />
      <ThemedText style={[styles.feedbackButtonText, { color: iconColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function SearchScreen() {
  const { favoriteArtists, favoriteGenres, userVector, setUserVector } = usePreferences();
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<"like" | "dislike" | null>(
    null,
  );
  const resultCardBorderColor = useThemeColor({}, "icon");
  const resultCardBackgroundColor = useThemeColor(
    { light: "#faf7f7", dark: "#202325" },
    "background",
  );
  const playerContainerBackground = useThemeColor(
    { light: "#0b0b0c", dark: "#000000" },
    "background",
  );

  const onFeedback = async (liked: boolean) => {
    if (!selectedTrackId || pendingFeedback) return;
    setPendingFeedback(liked ? "like" : "dislike");
    if (Platform.OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // For Feedback on Like or Dislike
    }

    const song = results.find((s) => s.spotify_id === selectedTrackId);
    if (!song) {
      setPendingFeedback(null);
      return;
    }
    const updated = nudgeVector(userVector, song.audio_vector, liked);
    setUserVector(updated);
    setTimeout(() => {
      setPendingFeedback(null);
      setSelectedTrackId(null);
    }, 250);
  };

  const onSearch = async () => {
    setSelectedTrackId(null);
    setPendingFeedback(null);
    setLoading(true);
    try {
      const time = currentTimeOfDay();
      console.log("Current time: " + time);
      if (!mood) {
        console.error("Missing mood selection");
        return;
      }
      const token = await SpotifyAuth.get();
      if (!token) {
        router.replace("/login");
        return;
      }
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
      if (!response.ok) {
        console.error("Search API error:", response.status, data?.error ?? data);
        if (response.status === 401) {
          router.replace("/login");
        }
        return;
      }
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
        <View
          style={[
            styles.playerContainer,
            { backgroundColor: playerContainerBackground },
          ]}
        >
          <View style={styles.playerHeaderRow}>
            <ThemedText style={styles.playerHeaderText} numberOfLines={1}>
              Preview & Feedback
            </ThemedText>
            <Pressable
              onPress={() => {
                setSelectedTrackId(null);
                setPendingFeedback(null);
              }}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconSymbol name="xmark" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <WebView
            key={selectedTrackId}
            source={{
              uri: `https://open.spotify.com/embed/track/${selectedTrackId}?utm_source=generator&theme=0`,
            }}
            style={styles.player}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
          <View style={styles.feedbackRow}>
            <FeedbackButton
              kind="like"
              disabled={loading}
              pending={pendingFeedback === "like"}
              onPress={() => onFeedback(true)}
            />
            <FeedbackButton
              kind="dislike"
              disabled={loading}
              pending={pendingFeedback === "dislike"}
              onPress={() => onFeedback(false)}
            />
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
    height: 192,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  playerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  playerHeaderText: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingTop: 10,
  },
  feedbackButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  player: { 
    flex: 1,
    backgroundColor: "transparent",
  },
  noResultsTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});
