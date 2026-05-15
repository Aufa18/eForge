import { Stack } from "expo-router";
import { FavoritesProvider } from "../context/FavoritesContext";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Tahan splash screen agar tidak hilang sebelum font siap
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  // Load font kustom kamu
  const [loaded, error] = useFonts({
    "KronaOne": require("../assets/fonts/KronaOne-Regular.ttf"), // Pastikan nama file sesuai!
  });

  useEffect(() => {
    if (loaded || error) {
      // Sembunyikan splash screen kalau font sudah siap (atau kalau ada error)
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Jangan render UI apa pun sebelum font siap
  if (!loaded && !error) {
    return null;
  }

  return (
    <FavoritesProvider>
      <Stack screenOptions={{ animation: "fade", headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="about" />
        <Stack.Screen name="favorites" />
      </Stack>
    </FavoritesProvider>
  );
}