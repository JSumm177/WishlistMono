"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, updateVehicleSchema, type InsertVehicle, type UpdateVehicle } from "@wishlist/api/src/schemas/vehicle";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/navigation";

interface VehicleFormProps {
  initialData?: UpdateVehicle;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehicleForm({ initialData, onSuccess, onCancel }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InsertVehicle | UpdateVehicle>({
    resolver: zodResolver(isEditing ? updateVehicleSchema : insertVehicleSchema),
    defaultValues: initialData || {
      year: new Date().getFullYear(),
    },
  });

  const utils = trpc.useUtils();

  const addVehicle = trpc.addVehicle.useMutation({
    onSuccess: () => {
      reset();
      utils.getVehicles.invalidate();
      router.refresh();
      onSuccess?.();
    },
  });

  const updateVehicle = trpc.updateVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
      router.refresh();
      onSuccess?.();
    },
  });

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateVehicle.mutate(data);
    } else {
      addVehicle.mutate(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-6 border rounded-xl bg-gray-50 dark:bg-zinc-900"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input
            {...register("make")}
            className="w-full p-2 border rounded dark:bg-black"
            placeholder="e.g. Porsche"
          />
          {errors.make && (
            <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            {...register("model")}
            className="w-full p-2 border rounded dark:bg-black"
            placeholder="e.g. 911 GT3"
          />
          {errors.model && (
            <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="number"
            {...register("year", { valueAsNumber: true })}
            className="w-full p-2 border rounded dark:bg-black"
          />
          {errors.year && (
            <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (USD)</label>
          <input
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            className="w-full p-2 border rounded dark:bg-black"
            placeholder="e.g. 45000.00"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={addVehicle.isPending || updateVehicle.isPending}
          className="flex-1 bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {addVehicle.isPending || updateVehicle.isPending
            ? "Saving..."
            : isEditing
            ? "Update Vehicle"
            : "Add to Wishlist"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded font-bold hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
