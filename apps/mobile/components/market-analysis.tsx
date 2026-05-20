import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { trpc } from "../utils/trpc";
import { Ionicons } from "@expo/vector-icons";

interface MarketAnalysisProps {
  vehicleId: number;
  wishlistPrice: number | null;
}

// Brand helper definitions for premium styling matching Web
const BRAND_STYLES: Record<
  string,
  { name: string; bg: string; text: string; border: string; brandColor: string }
> = {
  cargurus: {
    name: "CarGurus",
    bg: "#eff6ff", // bg-blue-50
    text: "#1d4ed8", // text-blue-700
    border: "#dbeafe", // border-blue-100
    brandColor: "#00a0dd",
  },
  carmax: {
    name: "CarMax",
    bg: "#eef2ff", // bg-indigo-50
    text: "#4338ca", // text-indigo-700
    border: "#e0e7ff", // border-indigo-100
    brandColor: "#002c77",
  },
  carvana: {
    name: "Carvana",
    bg: "#ecfeff", // bg-cyan-50
    text: "#0e7490", // text-cyan-700
    border: "#cffafe", // border-cyan-100
    brandColor: "#00a4e4",
  },
  cars_and_bids: {
    name: "Cars & Bids",
    bg: "#fffbeb", // bg-amber-50
    text: "#b45309", // text-amber-800/700
    border: "#fef3c7", // border-amber-100
    brandColor: "#ffc107",
  },
  bring_a_trailer: {
    name: "Bring a Trailer",
    bg: "#fff7ed", // bg-orange-50
    text: "#c2410c", // text-orange-700
    border: "#ffedd5", // border-orange-100
    brandColor: "#e65100",
  },
};

export function MarketAnalysis({ vehicleId, wishlistPrice }: MarketAnalysisProps) {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch prices from server
  const { data: prices, isLoading, error } = trpc.getMarketPrices.useQuery({ vehicleId });

  // Refresh price mutation
  const refreshPrices = trpc.refreshMarketPrices.useMutation({
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: () => {
      utils.getMarketPrices.invalidate({ vehicleId });
      utils.getVehicles.invalidate();
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
    refreshPrices.mutate({ vehicleId });
  };

  const handleOpenUrl = async (url: string | null) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("Failed to open URL:", err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.loadingText}>Analyzing vehicle market prices...</Text>
      </View>
    );
  }

  if (error || !prices || prices.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="help-circle-outline" size={32} color="#9ca3af" style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No pricing history found for this vehicle.</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={[styles.primaryButton, isRefreshing && styles.disabledButton]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
          ) : (
            <Ionicons name="sync-outline" size={14} color="white" style={styles.buttonIcon} />
          )}
          <Text style={styles.primaryButtonText}>Analyze Market Value</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculations
  const validPrices = prices
    .filter((p) => p.price !== null)
    .map((p) => ({ ...p, price: p.price as number }));
  const priceValues = validPrices.map((p) => p.price);

  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;
  const averagePrice =
    priceValues.length > 0
      ? Math.round(priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length)
      : null;

  // bargain calculations
  let priceDiffPercent = 0;
  let dealType: "good" | "fair" | "premium" | "unknown" = "unknown";

  if (wishlistPrice && averagePrice) {
    const diff = wishlistPrice - averagePrice;
    priceDiffPercent = (diff / averagePrice) * 100;

    if (priceDiffPercent < -3) {
      dealType = "good";
    } else if (priceDiffPercent <= 3) {
      dealType = "fair";
    } else {
      dealType = "premium";
    }
  }

  // Calculate percentages for range slider
  const getPercentagePosition = (price: number) => {
    if (maxPrice === minPrice) return 50;
    const padding = (maxPrice - minPrice) * 0.1;
    const paddedMin = Math.max(0, minPrice - padding);
    const paddedMax = maxPrice + padding;
    const pct = ((price - paddedMin) / (paddedMax - paddedMin)) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Summary Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>MARKET ANALYSIS INDEX</Text>
          <View style={styles.avgPriceContainer}>
            <Text style={styles.avgPriceText}>
              {averagePrice ? `$${averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "N/A"}
            </Text>
            <Text style={styles.avgPriceLabel}>Market Avg</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#4b5563" />
          ) : (
            <Ionicons name="sync-outline" size={14} color="#4b5563" />
          )}
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? "Syncing..." : "Scan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Bargain Badge */}
      {dealType !== "unknown" && (
        <View style={styles.badgeContainer}>
          {dealType === "good" && (
            <View style={[styles.badge, styles.goodBadge]}>
              <Ionicons name="trending-down-outline" size={14} color="#047857" style={styles.badgeIcon} />
              <Text style={[styles.badgeText, styles.goodBadgeText]}>
                Good Deal ({Math.abs(priceDiffPercent).toFixed(1)}% Below Avg)
              </Text>
            </View>
          )}
          {dealType === "fair" && (
            <View style={[styles.badge, styles.fairBadge]}>
              <Ionicons name="information-circle-outline" size={14} color="#374151" style={styles.badgeIcon} />
              <Text style={[styles.badgeText, styles.fairBadgeText]}>
                Fair Price (Near Market Avg)
              </Text>
            </View>
          )}
          {dealType === "premium" && (
            <View style={[styles.badge, styles.premiumBadge]}>
              <Ionicons name="trending-up-outline" size={14} color="#b45309" style={styles.badgeIcon} />
              <Text style={[styles.badgeText, styles.premiumBadgeText]}>
                Premium Price ({priceDiffPercent.toFixed(1)}% Above Avg)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 2. Visual Price Range Slider */}
      {priceValues.length > 1 && (
        <View style={styles.sliderSection}>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>
              Min (${minPrice ? minPrice.toLocaleString() : "N/A"})
            </Text>
            <Text style={[styles.sliderLabelText, styles.sliderLabelMiddle]}>
              Market Spread
            </Text>
            <Text style={styles.sliderLabelText}>
              Max (${maxPrice ? maxPrice.toLocaleString() : "N/A"})
            </Text>
          </View>

          <View style={styles.sliderTrackContainer}>
            {/* The Track Bar */}
            <View style={styles.sliderTrack} />

            {/* Render platform dots */}
            {validPrices.map((p) => {
              const brand = BRAND_STYLES[p.source];
              const pos = getPercentagePosition(p.price);
              return (
                <View
                  key={p.source}
                  style={[
                    styles.sliderDot,
                    {
                      left: `${pos}%`,
                      backgroundColor: brand?.brandColor || "#ccc",
                    },
                  ]}
                />
              );
            })}

            {/* Render Wishlist Target marker if it exists */}
            {wishlistPrice && (
              <View
                style={[
                  styles.targetMarkerContainer,
                  { left: `${getPercentagePosition(wishlistPrice)}%` },
                ]}
              >
                <View style={styles.targetMarker} />
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>
                    Target: ${wishlistPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 3. Platform grid breakdowns */}
      <Text style={styles.sectionHeader}>PLATFORM BREAKDOWN</Text>
      <View style={styles.platformGrid}>
        {prices.map((p) => {
          const brand = BRAND_STYLES[p.source] || {
            name: p.source,
            bg: "#f3f4f6",
            text: "#374151",
            border: "#e5e7eb",
            brandColor: "#aaa",
          };

          const isEstimated = p.lastFetchedAt === null;

          return (
            <View
              key={p.id}
              style={[
                styles.platformCard,
                {
                  backgroundColor: brand.bg,
                  borderColor: brand.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.brandNameText, { color: brand.text }]}>
                  {brand.name.toUpperCase()}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {isEstimated ? "Index" : "Scraped"}
                  </Text>
                </View>
              </View>

              <Text style={styles.platformPrice}>
                {p.price ? `$${p.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "Searching"}
              </Text>

              {p.url ? (
                <TouchableOpacity
                  onPress={() => handleOpenUrl(p.url)}
                  style={styles.browseButton}
                >
                  <Text style={styles.browseButtonText}>Browse Listings</Text>
                  <Ionicons name="open-outline" size={10} color="#4b5563" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    padding: 16,
    backgroundColor: "#f9fafb", // slate/zinc-50
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loadingText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonSpinner: {
    marginRight: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
  },
  avgPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  avgPriceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2937",
  },
  avgPriceLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginLeft: 6,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4b5563",
    marginLeft: 4,
  },
  badgeContainer: {
    marginBottom: 16,
    alignItems: "flex-start",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  goodBadge: {
    backgroundColor: "#ecfdf5",
    borderColor: "#d1fae5",
  },
  goodBadgeText: {
    color: "#047857",
  },
  fairBadge: {
    backgroundColor: "#f4f4f5",
    borderColor: "#e4e4e7",
  },
  fairBadgeText: {
    color: "#374151",
  },
  premiumBadge: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  premiumBadgeText: {
    color: "#b45309",
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
  },
  sliderLabelMiddle: {
    color: "#6b7280",
  },
  sliderTrackContainer: {
    height: 32,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrack: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    width: "100%",
  },
  sliderDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "white",
    top: 10, // Center relative to 32px height
    marginLeft: -6, // Shift left half of width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  targetMarkerContainer: {
    position: "absolute",
    alignItems: "center",
    top: 0,
    bottom: 0,
    marginLeft: -1,
    zIndex: 10,
  },
  targetMarker: {
    width: 3,
    height: 28,
    backgroundColor: "#2563eb",
    borderRadius: 1.5,
  },
  targetBadge: {
    position: "absolute",
    bottom: -18,
    backgroundColor: "#2563eb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  platformCard: {
    width: "48%", // Grid layout
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    marginHorizontal: "1%",
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  brandNameText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  platformPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginVertical: 4,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingVertical: 4,
    marginTop: 6,
  },
  browseButtonText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4b5563",
    marginRight: 4,
  },
});
