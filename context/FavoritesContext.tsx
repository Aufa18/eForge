import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Favorite {
  name: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  toggleFavorite: (pokemon: Favorite) => void;
  isFavorite: (name: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

// Key unik untuk menyimpan data di memori HP
const STORAGE_KEY = "@pokedex_favorites";

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // 1. Ambil data dari memori HP saat aplikasi pertama kali dibuka
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setFavorites(JSON.parse(savedData));
        }
      } catch (e) {
        console.error("Gagal mengambil data favorit:", e);
      }
    };
    loadFavorites();
  }, []);

  // 2. Simpan data ke memori HP setiap kali state 'favorites' berubah
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.error("Gagal menyimpan data favorit:", e);
      }
    };
    saveFavorites();
  }, [favorites]);

  const toggleFavorite = (pokemon: Favorite) => {
    setFavorites((prev) => {
      const isExist = prev.some((fav) => fav.name === pokemon.name);
      if (isExist) {
        return prev.filter((fav) => fav.name !== pokemon.name);
      } else {
        return [...prev, pokemon];
      }
    });
  };

  const isFavorite = (name: string) => {
    return favorites.some((fav) => fav.name === name);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
