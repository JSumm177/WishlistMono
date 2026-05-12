import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { trpc } from "../utils/trpc";
import { useAuth, useUser, SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const {
    data: vehicles,
    isLoading,
    error,
    refetch,
  } = trpc.getVehicles.useQuery(undefined, {
    enabled: !!userId,
  });

  const utils = trpc.useUtils();
  const deleteVehicle = trpc.deleteVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
    },
  });

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Vehicle",
      "Are you sure you want to remove this from your wishlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteVehicle.mutate({ id }),
        },
      ],
    );
  };

  if (!isLoaded) return null;

  return (
    <View style={styles.container}>
      <SignedIn>
        <View style={styles.header}>
          <Text style={styles.welcome}>Hi, {user?.firstName || "User"}</Text>
          <Link href="/add" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </Link>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="car-outline" size={24} color="#9ca3af" />
                  </View>
                )}

                <View style={styles.cardContent}>
                  <Text style={styles.vehicleTitle} numberOfLines={1}>
                    {item.year} {item.make} {item.model}
                  </Text>
                  {item.price && (
                    <Text style={styles.vehiclePrice}>
                      ${item.price.toLocaleString()}
                    </Text>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No vehicles found.</Text>
            }
            onRefresh={refetch}
            refreshing={isLoading}
            style={styles.list}
          />
        )}
      </SignedIn>

      <SignedOut>
        <View style={styles.centered}>
          <Ionicons name="car-sport" size={80} color="#ccc" />
          <Text style={styles.title}>Vehicle Wishlist</Text>
          <Text style={styles.subtitle}>Sign in to start your collection</Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/sign-up" asChild>
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10 }]}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SignedOut>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  welcome: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#2563eb",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: "#f3f4f6",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  vehiclePrice: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 2,
  },
  cardActions: {
    paddingRight: 10,
  },
  actionButton: {
    padding: 8,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
  loader: {
    marginTop: 50,
  },
});
