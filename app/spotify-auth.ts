import * as SecureStore from "expo-secure-store";

const SPOTIFY_AUTH_KEY = "spotify_auth";

type SpotifyAuthApiResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type StoredSpotifyAuth = {
  access_token: string;
  refresh_token: string;
  access_token_expires_at: number;
  token_type: string;
  scope: string;
};

export class SpotifyAuth {
  // Saves Spotify Auth Data to Secure Storage
  static async save(payload: SpotifyAuthApiResponse): Promise<void> {
    if (
      !payload.access_token ||
      !payload.refresh_token ||
      !payload.expires_in ||
      !(await SecureStore.isAvailableAsync())
    ) {
      return;
    }

    const value: StoredSpotifyAuth = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      access_token_expires_at: Date.now() + payload.expires_in * 1000,
      token_type: payload.token_type ?? "Bearer",
      scope: payload.scope ?? "",
    };

    await SecureStore.setItemAsync(SPOTIFY_AUTH_KEY, JSON.stringify(value));
  }

  // Clears Spotify Auth Data from Secure Storage
  static async clear(): Promise<void> {
    if (!(await SecureStore.isAvailableAsync())) {
      return;
    }
    await SecureStore.deleteItemAsync(SPOTIFY_AUTH_KEY);
  }

  // Retrieves Valid Spotify Access Token, Refreshing if Necessary
  static async get(): Promise<string | null> {
    if (!(await SecureStore.isAvailableAsync())) {
      return null;
    }

    const raw = await SecureStore.getItemAsync(SPOTIFY_AUTH_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSpotifyAuth;
      if (
        !parsed.access_token ||
        !parsed.refresh_token ||
        !parsed.access_token_expires_at
      ) {
        return null;
      }

      // Check if Access Token is Expired
      if (parsed.access_token_expires_at > Date.now() + 60000) {
        return parsed.access_token;
      }

      // Refresh Access Token if Expired
      try {
        const response = await fetch("/spotify-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: parsed.refresh_token }),
        });

        const refreshed: SpotifyAuthApiResponse = await response.json();

        if (!response.ok || !refreshed.access_token || !refreshed.expires_in) {
          await SpotifyAuth.clear();
          return null;
        }

        await SpotifyAuth.save({
          ...refreshed,
          refresh_token: refreshed.refresh_token ?? parsed.refresh_token,
        });

        return refreshed.access_token;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }
}
