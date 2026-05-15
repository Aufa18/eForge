import { useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  BackHandler,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";

interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: PokemonType[];
}

interface PokemonType {
  type: { name: string; url: string };
}

interface PokemonMetadata {
  name: string;
  url: string;
  id: number;
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

const sortOptions = ["ID Asc", "ID Desc", "A - Z", "Z - A"];
const genOptions = ["All", "Gen 1 (Kanto)", "Gen 2 (Johto)", "Gen 3 (Hoenn)"];
const typeOptions = [
  "All",
  "grass",
  "fire",
  "water",
  "bug",
  "normal",
  "electric",
  "poison",
];

const getIdFromUrl = (url: string) => {
  const parts = url.split("/").filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
};

export default function Index() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [appMode, setAppMode] = useState<"infinite" | "server-filtered">(
    "infinite",
  );
  const [nextUrl, setNextUrl] = useState<string | null>(
    "https://pokeapi.co/api/v2/pokemon/?limit=20",
  );
  const [isLoading, setIsLoading] = useState(false);
  const { favorites } = useFavorites();

  const [searchText, setSearchText] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("ID Asc");
  const [selectedGen, setSelectedGen] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [filteredMetadata, setFilteredMetadata] = useState<PokemonMetadata[]>(
    [],
  );
  const [filterOffset, setFilterOffset] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (searchText.length > 0 || appMode !== "infinite") {
          resetToInfiniteMode();
          return true;
        }

        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => backHandler.remove();
    }, [searchText, appMode]),
  );

  async function fetchPokemonsInfinite() {
    if (!nextUrl || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(nextUrl);
      const data = await response.json();
      setNextUrl(data.next);

      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            id: details.id,
            name: pokemon.name,
            image:
              details.sprites.other["official-artwork"].front_default ||
              details.sprites.front_default,
            types: details.types,
          };
        }),
      );

      setPokemons((prev) => {
        const newUniqPokemons = detailedPokemons.filter(
          (newPoke) => !prev.some((p) => p.name === newPoke.name),
        );
        return [...prev, ...newUniqPokemons];
      });
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleServerSearch() {
    if (!searchText.trim()) {
      resetToInfiniteMode();
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setAppMode("server-filtered");

    setFilteredMetadata([]);
    setFilterOffset(0);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${searchText.toLowerCase().trim()}`,
      );
      if (!response.ok) {
        setPokemons([]);
        return;
      }
      const details = await response.json();
      setPokemons([
        {
          id: details.id,
          name: details.name,
          image:
            details.sprites.other["official-artwork"].front_default ||
            details.sprites.front_default,
          types: details.types,
        },
      ]);
    } catch (e) {
      setPokemons([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplyFilter() {
    setIsFilterVisible(false);
    setIsLoading(true);
    setPokemons([]);
    setFilterOffset(0);
    setAppMode("server-filtered");

    try {
      let listToLoad: PokemonMetadata[] = [];

      if (selectedType !== "All") {
        const res = await fetch(
          `https://pokeapi.co/api/v2/type/${selectedType}`,
        );
        const data = await res.json();
        listToLoad = data.pokemon.map((p: any) => ({
          name: p.pokemon.name,
          url: p.pokemon.url,
          id: getIdFromUrl(p.pokemon.url),
        }));
      } else {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/?limit=1000`,
        );
        const data = await res.json();
        listToLoad = data.results.map((p: any) => ({
          name: p.name,
          url: p.url,
          id: getIdFromUrl(p.url),
        }));
      }

      if (selectedGen === "Gen 1 (Kanto)")
        listToLoad = listToLoad.filter((p) => p.id >= 1 && p.id <= 151);
      if (selectedGen === "Gen 2 (Johto)")
        listToLoad = listToLoad.filter((p) => p.id >= 152 && p.id <= 251);
      if (selectedGen === "Gen 3 (Hoenn)")
        listToLoad = listToLoad.filter((p) => p.id >= 252 && p.id <= 386);

      listToLoad.sort((a, b) => {
        if (selectedSort === "A - Z") return a.name.localeCompare(b.name);
        if (selectedSort === "Z - A") return b.name.localeCompare(a.name);
        if (selectedSort === "ID Desc") return b.id - a.id;
        return a.id - b.id;
      });

      setFilteredMetadata(listToLoad);

      await fetchDetailsFromMetadata(listToLoad, 0);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  }

  const resetToInfiniteMode = async () => {
    setSearchText("");
    setSelectedType("All");
    setSelectedGen("All");
    setSelectedSort("ID Asc");
    setFilteredMetadata([]);
    setFilterOffset(0);
    setAppMode("infinite");

    setPokemons([]);
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon/?limit=20",
      );
      const data = await response.json();

      setNextUrl(data.next);

      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            id: details.id,
            name: pokemon.name,
            image:
              details.sprites.other["official-artwork"].front_default ||
              details.sprites.front_default,
            types: details.types,
          };
        }),
      );

      setPokemons(detailedPokemons);
    } catch (e) {
      console.log("Error reset:", e);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchDetailsFromMetadata(
    metadataList: PokemonMetadata[],
    offset: number,
  ) {
    const nextBatch = metadataList.slice(offset, offset + 20);
    if (nextBatch.length === 0) return;

    const details = await Promise.all(
      nextBatch.map(async (p) => {
        const res = await fetch(p.url);
        const d = await res.json();
        return {
          id: d.id,
          name: d.name,
          image:
            d.sprites.other["official-artwork"].front_default ||
            d.sprites.front_default,
          types: d.types,
        };
      }),
    );

    setPokemons((prev) => [...prev, ...details]);
    setFilterOffset(offset + 20);
  }

  const capitalizeFirstLetter = (string: string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

  const renderPokemon = ({ item }: { item: Pokemon }) => {
    const typeName = item.types[0]?.type.name || "normal";
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
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>eForge</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Pokemon..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleServerSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={resetToInfiniteMode} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </Pressable>
          )}
          <Pressable
            onPress={() => setIsFilterVisible(true)}
            style={styles.filterIconContainer}
          >
            <Ionicons name="options-outline" size={20} color="#333" />
          </Pressable>
        </View>

        <Pressable
          style={styles.favoriteBasket}
          onPress={() => router.push("/favorites")}
        >
          <Ionicons name="heart" size={28} color="#554a4a" />
          {favorites.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{favorites.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {isLoading && pokemons.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={pokemons}
          keyExtractor={(item, index) => item.name + index}
          renderItem={renderPokemon}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (isLoading) return;

            if (appMode === "infinite") {
              fetchPokemonsInfinite();
            } else if (
              appMode === "server-filtered" &&
              filteredMetadata.length > 0
            ) {
              fetchDetailsFromMetadata(filteredMetadata, filterOffset);
            }
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            isLoading && appMode === "infinite" ? (
              <ActivityIndicator size="large" color="#000" />
            ) : null
          }
          ListEmptyComponent={() =>
            !isLoading ? (
              <Text style={styles.emptyText}>Data tidak ditemukan.</Text>
            ) : null
          }
        />
      )}

      <Modal
        visible={isFilterVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsFilterVisible(false)}
          />

          <View style={styles.centeredModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setIsFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.pillContainer}>
                {sortOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.pill,
                      selectedSort === opt && styles.pillActive,
                    ]}
                    onPress={() => setSelectedSort(opt)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedSort === opt && styles.pillTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Generation</Text>
              <View style={styles.pillContainer}>
                {genOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.pill,
                      selectedGen === opt && styles.pillActive,
                    ]}
                    onPress={() => setSelectedGen(opt)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedGen === opt && styles.pillTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Type</Text>
              <View style={styles.pillContainer}>
                {typeOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.pill,
                      selectedType === opt && styles.pillActive,
                    ]}
                    onPress={() => setSelectedType(opt)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedType === opt && styles.pillTextActive,
                      ]}
                    >
                      {capitalizeFirstLetter(opt)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.applyButton} onPress={handleApplyFilter}>
                <Text style={styles.applyButtonText}>Terapkan Filter</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 5,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "KronaOne",
    color: "#554a4a",
    marginRight: 10,
  },
  favoriteBasket: { position: "relative", padding: 2 },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "black",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "bold" },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6F8",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 10,
  },
  searchIcon: { marginRight: 5 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
  },
  clearIcon: { paddingHorizontal: 5 },
  filterIconContainer: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    marginLeft: 5,
  },
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
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  centeredModalBox: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 25,
    width: "90%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
  },
  pillActive: { backgroundColor: "#383030", borderColor: "#554a4a" },
  pillText: { fontSize: 14, color: "#666", fontWeight: "500" },
  pillTextActive: { color: "#FFF", fontWeight: "bold" },
  applyButton: {
    backgroundColor: "#5c5a5a",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },
  applyButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
