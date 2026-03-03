import { FontAwesome } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

type AuthExchangeResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

const REDIRECT_URI = "algo-rhythm://spotify-auth-callback";

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

  const onAuthorizeClick = async () => {
    if (!clientId) {
      console.error(
        "Missing Spotify Client ID. Please set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in your .env file.",
      );
      return;
    }

    const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: "user-read-email user-top-read",
      state,
      show_dialog: "true",
    });

    setIsLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `https://accounts.spotify.com/authorize?${params.toString()}`,
        REDIRECT_URI,
      );

      if (result.type !== "success") {
        return;
      }

      const callback = new URL(result.url);
      const code = callback.searchParams.get("code");
      const error = callback.searchParams.get("error");

      if (error) {
        console.error("Spotify Authorization Error:", error);
        return;
      }

      if (!code || callback.searchParams.get("state") !== state) {
        console.error("Invalid Spotify Authorization Response");
        return;
      }

      const response = await fetch("/spotify-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      });
      const auth: AuthExchangeResponse = await response.json();

      if (!response.ok || !auth.access_token || !auth.refresh_token) {
        console.error(
          "Spotify Token Exchange Failed:",
          auth.error || "Unknown Error",
        );
        return;
      }

      // Save State From Token Exchange in Secure Store

      router.replace("/(tabs)/search");
    } catch {
      console.error("Spotify Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.logoWrap}>
            <FontAwesome name="spotify" size={72} color="#1DB954" />
            <Text style={styles.brand}>Spotify</Text>
          </View>

          <View style={styles.card}>
            <Pressable
              disabled={isLoading}
              onPress={onAuthorizeClick}
              style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.buttonText}>Authorize with Spotify</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  logoWrap: {
    alignItems: "center",
    gap: 10,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1DB954",
    borderRadius: 999,
    minHeight: 50,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "800",
  },
});
