"use client";

import { useState } from "react";
import { trpc } from "../utils/trpc";
import { VehicleForm } from "./vehicle-form";
import { Pencil, Trash2, TrendingUp } from "lucide-react";
import Image from "next/image";
import { type Vehicle } from "@wishlist/db";
import { MarketAnalysis } from "./market-analysis";

interface ExtendedVehicle extends Omit<Vehicle, "createdAt"> {
  createdAt: string | null;
  averageMarketPrice: number | null;
}

export function VehicleList({ initialVehicles }: { initialVehicles: ExtendedVehicle[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // Use tRPC to manage the list state (syncs with Server Component data)
  const { data: vehicles } = trpc.getVehicles.useQuery(undefined, {
    initialData: initialVehicles,
  });

  const utils = trpc.useUtils();
  const deleteVehicle = trpc.deleteVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
    },
  });

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (vehicles.length === 0) {
    return <p className="text-gray-500">No vehicles in your wishlist yet.</p>;
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="p-4 border rounded-xl shadow-sm bg-white dark:bg-zinc-800"
        >
          {editingId === vehicle.id ? (
            <VehicleForm
              initialData={{
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price ?? undefined,
                imageUrl: vehicle.imageUrl ?? undefined,
              }}
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div>
              <div className="flex gap-4 items-center">
                {vehicle.imageUrl ? (
                  <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={vehicle.imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-16 bg-gray-100 dark:bg-zinc-700 rounded-md flex items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {vehicle.price && (
                      <span className="text-zinc-900 dark:text-zinc-100 font-extrabold text-base">
                        ${vehicle.price.toLocaleString()}
                      </span>
                    )}
                    {vehicle.averageMarketPrice && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        vehicle.price 
                          ? vehicle.price < vehicle.averageMarketPrice 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}>
                        Market Avg: ${Math.round(vehicle.averageMarketPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpanded(vehicle.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 rounded-lg text-[10px] font-extrabold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition border border-zinc-200/50 dark:border-zinc-700/50 mt-2"
                  >
                    <TrendingUp size={12} className="text-blue-500" />
                    {expandedIds[vehicle.id] ? "Hide Market Analysis" : "Show Market Analysis"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(vehicle.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full"
                  >
                    <Pencil
                      size={18}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure?")) {
                        deleteVehicle.mutate({ id: vehicle.id });
                      }
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>

              {expandedIds[vehicle.id] && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 mt-4 pt-1 transition-all duration-300 ease-in-out">
                  <MarketAnalysis
                    vehicleId={vehicle.id}
                    wishlistPrice={vehicle.price ?? null}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
