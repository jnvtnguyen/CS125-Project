import Storage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEYS = {
  artists: 'settings.favoriteArtists',
  genres: 'settings.favoriteGenres',
} as const;

const parseStoredArray = (raw: string | null) => {
  if (!raw) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch (error) {
    console.error('failed to parse stored preferences', error);
  }

  return [] as string[];
};

export function usePreferences() {
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [artistsRaw, genresRaw] = await Promise.all([
        Storage.getItem(STORAGE_KEYS.artists),
        Storage.getItem(STORAGE_KEYS.genres),
      ]);

      if (!isMounted.current) {
        return;
      }

      setFavoriteArtists(parseStoredArray(artistsRaw));
      setFavoriteGenres(parseStoredArray(genresRaw));
    } catch (error) {
      console.error('failed to load settings preferences', error);
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
        await Storage.setItem(STORAGE_KEYS.artists, JSON.stringify(favoriteArtists));
      } catch (error) {
        console.error('failed to persist favorite artists', error);
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
        await Storage.setItem(STORAGE_KEYS.genres, JSON.stringify(favoriteGenres));
      } catch (error) {
        console.error('failed to persist favorite genres', error);
      }
    };

    persistGenres();
  }, [favoriteGenres, isHydrated]);

  return {
    favoriteArtists,
    favoriteGenres,
    isHydrated,
    setFavoriteArtists,
    setFavoriteGenres,
    refresh,
  };
}
