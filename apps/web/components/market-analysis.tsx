"use client";

import { trpc } from "../utils/trpc";
import { useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Info,
  TrendingUp,
  TrendingDown,
  HelpCircle,
} from "lucide-react";

interface MarketAnalysisProps {
  vehicleId: number;
  wishlistPrice: number | null;
}

// Brand helper definitions for premium styling
const BRAND_STYLES: Record<
  string,
  { name: string; bg: string; text: string; border: string; brandColor: string }
> = {
  cargurus: {
    name: "CarGurus",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/30",
    brandColor: "#00a0dd",
  },
  carmax: {
    name: "CarMax",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-900/30",
    brandColor: "#002c77",
  },
  carvana: {
    name: "Carvana",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-900/30",
    brandColor: "#00a4e4",
  },
  cars_and_bids: {
    name: "Cars & Bids",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-800 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/30",
    brandColor: "#ffc107",
  },
  bring_a_trailer: {
    name: "Bring a Trailer",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900/30",
    brandColor: "#e65100",
  },
};

export function MarketAnalysis({
  vehicleId,
  wishlistPrice,
}: MarketAnalysisProps) {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch prices from server
  const {
    data: prices,
    isLoading,
    error,
  } = trpc.getMarketPrices.useQuery({ vehicleId });

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Analyzing vehicle market prices...
        </p>
      </div>
    );
  }

  if (error || !prices || prices.length === 0) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
        <HelpCircle size={32} className="text-zinc-400 mb-2" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium mb-3">
          No pricing history found for this vehicle.
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs transition duration-200 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Analyze Market Value
        </button>
      </div>
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
      ? Math.round(
          priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length,
        )
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
    const padding = (maxPrice - minPrice) * 0.1; // Add 10% padding to bounds for better spacing
    const paddedMin = Math.max(0, minPrice - padding);
    const paddedMax = maxPrice + padding;
    return ((price - paddedMin) / (paddedMax - paddedMin)) * 100;
  };

  return (
    <div className="mt-4 p-5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-inner space-y-6">
      {/* 1. Header Summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
        <div>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Market Analysis Index
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              {averagePrice
                ? `$${averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "N/A"}
            </h4>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Market Avg
            </span>
          </div>
        </div>

        {/* Dynamic Bargain Badge */}
        {dealType !== "unknown" && (
          <div className="flex items-center gap-2">
            {dealType === "good" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold shadow-sm">
                <TrendingDown size={14} />
                Good Deal ({Math.abs(priceDiffPercent).toFixed(1)}% Below Avg)
              </div>
            )}
            {dealType === "fair" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-bold shadow-sm">
                <Info size={14} />
                Fair Price (Near Market Avg)
              </div>
            )}
            {dealType === "premium" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold shadow-sm">
                <TrendingUp size={14} />
                Premium Price ({priceDiffPercent.toFixed(1)}% Above Avg)
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-center flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition duration-200 disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Syncing..." : "Scan Markets"}
        </button>
      </div>

      {/* 2. Visual Price Range Slider */}
      {priceValues.length > 1 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-zinc-400 dark:text-zinc-500 font-medium px-1">
            <span>
              Cheapest ({minPrice ? `$${minPrice.toLocaleString()}` : "N/A"})
            </span>
            <span>Market Spread</span>
            <span>
              Premium ({maxPrice ? `$${maxPrice.toLocaleString()}` : "N/A"})
            </span>
          </div>

          <div className="relative h-4 bg-gradient-to-r from-emerald-500/20 via-amber-500/10 to-red-500/20 rounded-full border border-zinc-200/50 dark:border-zinc-800/80">
            {/* The Range Gradient bar */}
            <div className="absolute inset-y-0 left-2 right-2 bg-gradient-to-r from-emerald-500/30 via-amber-500/20 to-rose-500/30 rounded-full" />

            {/* Render platform dots */}
            {validPrices.map((p) => {
              const brand = BRAND_STYLES[p.source];
              const pos = getPercentagePosition(p.price);
              return (
                <div
                  key={p.source}
                  className="absolute group -translate-x-1/2 -top-1"
                  style={{ left: `${pos}%` }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 shadow-md cursor-pointer hover:scale-125 transition-transform duration-150"
                    style={{ backgroundColor: brand?.brandColor || "#ccc" }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
                    {brand?.name || p.source}: ${p.price.toLocaleString()}
                  </div>
                </div>
              );
            })}

            {/* Render Wishlist Target marker if it exists */}
            {wishlistPrice && (
              <div
                className="absolute group -translate-x-1/2 -top-3 bottom-0 flex flex-col items-center"
                style={{ left: `${getPercentagePosition(wishlistPrice)}%` }}
              >
                {/* Pointer marker */}
                <div className="w-1.5 h-10 bg-blue-600 dark:bg-blue-400 rounded-full shadow-lg border border-white dark:border-zinc-950 z-10" />
                <div className="absolute -top-6 bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap z-20">
                  Target: ${wishlistPrice.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Platform grid breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {prices.map((p) => {
          const brand = BRAND_STYLES[p.source] || {
            name: p.source,
            bg: "bg-zinc-50 dark:bg-zinc-800",
            text: "text-zinc-700 dark:text-zinc-300",
            border: "border-zinc-200 dark:border-zinc-700",
            brandColor: "#aaa",
          };

          const isEstimated = p.lastFetchedAt === null;

          return (
            <div
              key={p.id}
              className={`p-3.5 border rounded-xl flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ${brand.bg} ${brand.border}`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[10px] font-extrabold tracking-wider uppercase ${brand.text}`}
                  >
                    {brand.name}
                  </span>
                  <span className="text-[8px] bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-1 rounded-sm uppercase font-semibold">
                    {isEstimated ? "Index" : "Scraped"}
                  </span>
                </div>
                <h5 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-100">
                  {p.price
                    ? `$${p.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "Searching"}
                </h5>
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 flex items-center justify-center gap-1 py-1 px-2 border border-zinc-200 hover:bg-white dark:hover:bg-zinc-800 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white rounded-lg text-[10px] font-bold transition duration-200"
              >
                Browse Listings
                <ExternalLink size={10} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
