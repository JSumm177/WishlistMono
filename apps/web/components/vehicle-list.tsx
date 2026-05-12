"use client";

import { useState } from "react";
import { trpc } from "../utils/trpc";
import { VehicleForm } from "./vehicle-form";
import { Pencil, Trash2 } from "lucide-react";

export function VehicleList({ initialVehicles }: { initialVehicles: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

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

  if (vehicles.length === 0) {
    return <p className="text-gray-500">No vehicles in your wishlist yet.</p>;
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="p-4 border rounded-lg shadow-sm bg-white dark:bg-zinc-800">
          {editingId === vehicle.id ? (
            <VehicleForm
              initialData={{
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price ?? undefined,
              }}
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                {vehicle.price && (
                  <p className="text-gray-600 dark:text-gray-400">
                    ${vehicle.price.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(vehicle.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full"
                >
                  <Pencil size={18} className="text-gray-600 dark:text-gray-300" />
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
          )}
        </div>
      ))}
    </div>
  );
}
