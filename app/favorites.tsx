import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";

interface Pokemon {
  name: string;
  image: string;
  types: PokemonType[];
}

interface PokemonType {
  type: {
    name: string;
    url: string;
  };
}

const colorsByType: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#4DAD5B",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

export default function Favorites() {
  const { favorites } = useFavorites();
  const [favoritePokemons, setFavoritePokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFavoriteDetails() {
      if (favorites.length === 0) {
        setFavoritePokemons([]);
        return;
      }

      setLoading(true);
      try {
        const detailedPokemons = await Promise.all(
          favorites.map(async (fav) => {
            const res = await fetch(
              `https://pokeapi.co/api/v2/pokemon/${fav.name}`,
            );
            const details = await res.json();
            return {
              name: details.name,
              image:
                details.sprites.other["official-artwork"].front_default ||
                details.sprites.front_default,
              types: details.types,
            };
          }),
        );
        setFavoritePokemons(detailedPokemons);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteDetails();
  }, [favorites]);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const renderPokemon = ({ item }: { item: Pokemon }) => {
    const typeName = item.types[0].type.name;
    const bgColor = colorsByType[typeName] || "#ccc";

    return (
      <Pressable
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() =>
          router.push({ pathname: "/about", params: { name: item.name } })
        }
      >
        <Text style={styles.name}>{capitalizeFirstLetter(item.name)}</Text>
        <Image
          source={{ uri: item.image }}
          style={styles.pokemonImage}
          contentFit="contain"
          transition={500}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Pokemon Favorit</Text>
        <View style={{ width: 28 }} />
      </View>

      {favorites.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Belum ada Pokemon favorit</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={favoritePokemons}
          keyExtractor={(item) => item.name}
          renderItem={renderPokemon}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#000" },
  backButton: { padding: 5 },
  listContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  row: { justifyContent: "space-between" },
  card: {
    flex: 1,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 184,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  pokemonImage: { width: 100, height: 100 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#999", marginTop: 10 },
});
