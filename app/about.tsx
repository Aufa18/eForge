import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "@/context/FavoritesContext";

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

const statColors: Record<string, string> = {
  hp: "#4CAF50",
  attack: "#F44336",
  defense: "#FFC107",
  "special-attack": "#F44336",
  "special-defense": "#FFC107",
  speed: "#2196F3",
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function About() {
  const { name } = useLocalSearchParams();
  const [pokemonDetail, setPokemonDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (name) {
      fetchPokemonDetail();
    }
  }, [name]);

  async function fetchPokemonDetail() {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const data = await response.json();
      setPokemonDetail(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4DAD5B" />
      </SafeAreaView>
    );
  }

  if (!pokemonDetail) return null;

  const primaryType = pokemonDetail.types[0].type.name;
  const bgColor = colorsByType[primaryType] || "#ccc";

  const formattedId = `#${String(pokemonDetail.id).padStart(3, "0")}`;

  return (
    <View style={styles.container}>
      <SafeAreaView
        style={[styles.headerBackground, { backgroundColor: bgColor }]}
        edges={["top"]}
      >
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </Pressable>

          <Pressable onPress={() => toggleFavorite({ name: String(name) })}>
            <Ionicons
              name={isFavorite(String(name)) ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite(String(name)) ? "#FF4B4B" : "white"}
            />
          </Pressable>
        </View>

        <View style={styles.headerInfo}>
          <View>
            <Text style={styles.pokemonName}>
              {capitalizeFirstLetter(pokemonDetail.name)}
            </Text>
            <View style={styles.typesContainer}>
              {pokemonDetail.types.map((t: any) => (
                <View key={t.type.name} style={styles.typeBadge}>
                  <Text style={styles.typeText}>
                    {capitalizeFirstLetter(t.type.name)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.pokemonId}>{formattedId}</Text>
        </View>

        <Image
          source={{
            uri: pokemonDetail.sprites.other["official-artwork"].front_default,
          }}
          style={styles.pokemonImage}
          resizeMode="contain"
        />
      </SafeAreaView>

      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tinggi</Text>
          <Text style={styles.infoValue}>{pokemonDetail.height / 10} m</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Berat</Text>
          <Text style={styles.infoValue}>{pokemonDetail.weight / 10} kg</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Statistik</Text>
        <View style={styles.statsContainer}>
          {pokemonDetail.stats.map((statItem: any) => {
            const statName = statItem.stat.name;
            const statValue = statItem.base_stat;
            const displayName = statName
              .replace("-", " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase());
            const barColor = statColors[statName] || "#333";

            const widthPercent = Math.min((statValue / 150) * 100, 100);

            return (
              <View key={statName} style={styles.statRow}>
                <Text style={styles.statLabel}>{displayName}</Text>
                <Text style={styles.statValue}>{statValue}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: barColor, width: `${widthPercent}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBackground: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pokemonName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  pokemonId: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    opacity: 0.8,
  },
  typesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  pokemonImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: -20,
    zIndex: 10,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    alignSelf: "flex-start",
    marginBottom: 15,
    paddingBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  infoLabel: {
    width: 100,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    marginBottom: 40,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    width: 120,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statValue: {
    width: 40,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
});
