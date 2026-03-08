/*
  * This hook manages the user's preferences for favorite artists and genres. Saving and loading preferences and persistence across app sessions
    is done by using the expo-sqlite/kv-store library.
*/
import Storage from "expo-sqlite/kv-store";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEYS = {
  artists: "settings.favorite_artists",
  genres: "settings.favorite_genres",
  userVector: "settings.user_vector",
} as const;

export function usePreferences() {
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [userVector, setUserVector] = useState<number[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [artists, genres, user_vector] = await Promise.all([
        Storage.getItem(STORAGE_KEYS.artists),
        Storage.getItem(STORAGE_KEYS.genres),
        Storage.getItem(STORAGE_KEYS.userVector),
      ]);

      if (!isMounted.current) {
        return;
      }

      setFavoriteArtists(artists ? JSON.parse(artists) : []);
      setFavoriteGenres(genres ? JSON.parse(genres) : []);
      setUserVector(user_vector ? JSON.parse(user_vector) : []);
    } catch (error) {
      console.error("failed to load settings preferences", error);
    } finally {
      if (isMounted.current) {
        setIsHydrated(true);
      }
    }
  }, []);

  useEffect(() => {
    refresh();

    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistArtists = async () => {
      try {
        await Storage.setItem(
          STORAGE_KEYS.artists,
          JSON.stringify(favoriteArtists),
        );
      } catch (error) {
        console.error("failed to persist favorite artists", error);
      }
    };

    persistArtists();
  }, [favoriteArtists, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistGenres = async () => {
      try {
        await Storage.setItem(
          STORAGE_KEYS.genres,
          JSON.stringify(favoriteGenres),
        );
      } catch (error) {
        console.error("failed to persist favorite genres", error);
      }
    };

    persistGenres();
  }, [favoriteGenres, isHydrated]);

  useEffect(() => {
    if (!isHydrated || userVector.length === 0) {
      return;
    }

    const persistUserVector = async () => {
      try {
        await Storage.setItem(
          STORAGE_KEYS.userVector,
          JSON.stringify(userVector),
        );
      } catch (error) {
        console.error("failed to persist user vector", error);
      }
    };

    persistUserVector();
  }, [userVector, isHydrated]);

  return {
    favoriteArtists,
    favoriteGenres,
    userVector,
    isHydrated,
    setFavoriteArtists,
    setFavoriteGenres,
    setUserVector,
    refresh,
  };
}
