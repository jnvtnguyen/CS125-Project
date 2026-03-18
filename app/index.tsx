import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { SpotifyAuth } from "@/app/spotify-auth";

export default function IndexScreen() {
  const [route, setRoute] = useState<"/login" | "/(tabs)/search" | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      const token = await SpotifyAuth.get();
      if (!isMounted) {
        return;
      }
      setRoute(token ? "/(tabs)/search" : "/login");
    };

    resolve();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!route) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={route} />;
}
