"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertVehicleSchema,
  updateVehicleSchema,
  type InsertVehicle,
  type UpdateVehicle,
} from "@wishlist/api/src/schemas/vehicle";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/navigation";
import { UploadButton } from "../utils/uploadthing";
import Image from "next/image";
import { useState, useEffect, useId } from "react";

interface VehicleFormProps {
  initialData?: UpdateVehicle;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const POPULAR_MAKES = [
  "Acura", "Alfa Romeo", "Alpine", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick", "Cadillac",
  "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai",
  "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Lucid",
  "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "MINI", "Mitsubishi", "Nissan", "Polestar", "Pontiac",
  "Porsche", "Ram", "Rivian", "Rolls-Royce", "Saab", "Saturn", "Scion", "Subaru", "Tesla", "Toyota",
  "Volkswagen", "Volvo"
];

export function VehicleForm({
  initialData,
  onSuccess,
  onCancel,
}: VehicleFormProps) {
  const router = useRouter();
  const formId = useId();
  const isEditing = !!initialData;
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    initialData?.imageUrl || undefined,
  );

  const startYear = 1940;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 2 - startYear }, (_, i) => currentYear + 1 - i);

  // Determine if initial make is part of POPULAR_MAKES
  const initMakeInList = initialData ? POPULAR_MAKES.includes(initialData.make) : true;

  // React State variables to control Year, Make, Model selections
  const [selectedYear, setSelectedYear] = useState<number>(
    initialData?.year || new Date().getFullYear()
  );
  const [selectedMake, setSelectedMake] = useState<string>(
    initialData ? (initMakeInList ? initialData.make : "Other") : ""
  );
  const [customMake, setCustomMake] = useState<boolean>(
    initialData ? !initMakeInList : false
  );
  const [customMakeVal, setCustomMakeVal] = useState<string>(
    initialData ? (!initMakeInList ? initialData.make : "") : ""
  );

  const [selectedModel, setSelectedModel] = useState<string>(
    initialData ? (initMakeInList ? initialData.model : "Other") : ""
  );
  const [customModel, setCustomModel] = useState<boolean>(
    initialData ? !initMakeInList : false
  );
  const [customModelVal, setCustomModelVal] = useState<string>(
    initialData ? (!initMakeInList ? initialData.model : "") : ""
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InsertVehicle | UpdateVehicle>({
    resolver: zodResolver(
      isEditing ? updateVehicleSchema : insertVehicleSchema,
    ),
    values: initialData
      ? {
          ...initialData,
          trim: initialData.trim || "",
        }
      : {
          make: "",
          model: "",
          trim: "",
          year: new Date().getFullYear(),
          price: undefined,
          imageUrl: "",
        },
  });

  const utils = trpc.useUtils();

  // Fetch models dynamically frombackend query (proxies NHTSA API)
  const { data: nhtsaModelsData = [], isLoading: isLoadingModels } = trpc.getModelsForMake.useQuery(
    { make: selectedMake, year: selectedYear },
    { enabled: !!selectedMake && selectedMake !== "Other" && !isNaN(selectedYear) }
  );
  const nhtsaModels = nhtsaModelsData as string[];

  // Sync loaded models for editing fallback
  useEffect(() => {
    if (initialData && selectedMake && selectedMake !== "Other" && nhtsaModels.length > 0) {
      const hasModel = nhtsaModels.includes(initialData.model);
      if (!hasModel && selectedModel !== "Other") {
        setCustomModel(true);
        setCustomModelVal(initialData.model);
        setSelectedModel("Other");
        setValue("model", initialData.model);
      } else if (hasModel) {
        setCustomModel(false);
        setSelectedModel(initialData.model);
        setValue("model", initialData.model);
      }
    }
  }, [nhtsaModels, initialData, selectedMake, selectedModel, setValue]);

  const addVehicle = trpc.addVehicle.useMutation({
    onSuccess: () => {
      reset();
      setImageUrl(undefined);
      setSelectedMake("");
      setSelectedModel("");
      setCustomMake(false);
      setCustomModel(false);
      setCustomMakeVal("");
      setCustomModelVal("");
      setSelectedYear(new Date().getFullYear());
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

  const onSubmit = (data: InsertVehicle | UpdateVehicle) => {
    if (isEditing) {
      updateVehicle.mutate(data as UpdateVehicle);
    } else {
      addVehicle.mutate(data as InsertVehicle);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-xl transition-all duration-300"
    >
      {isEditing && <input type="hidden" {...register("id")} />}
      <input type="hidden" {...register("make")} />
      <input type="hidden" {...register("model")} />

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl p-4 mb-4 bg-gray-50/50 dark:bg-zinc-900/30 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition duration-200">
        {imageUrl ? (
          <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-xl shadow-md border border-gray-100 dark:border-zinc-800">
            <Image
              src={imageUrl}
              alt="Vehicle preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageUrl(undefined);
                setValue("imageUrl", "");
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg transition"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">Upload vehicle photo</p>
            <UploadButton
              endpoint="vehicleImage"
              onClientUploadComplete={(res) => {
                const url = res?.[0]?.url;
                if (url) {
                  setImageUrl(url);
                  setValue("imageUrl", url);
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                alert("Upload failed. Please try again with a smaller image.");
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${formId}-year`}
            className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            Year
          </label>
          <select
            id={`${formId}-year`}
            value={selectedYear}
            onChange={(e) => {
              const yearVal = parseInt(e.target.value, 10);
              setSelectedYear(yearVal);
              setValue("year", yearVal, { shouldValidate: true });
              // Clear model when year changes since models vary by year
              if (selectedMake !== "Other") {
                setSelectedModel("");
                setValue("model", "");
              }
            }}
            className="w-full p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {errors.year && (
            <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-price`}
            className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            Price (USD)
          </label>
          <input
            id={`${formId}-price`}
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            className="w-full p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            placeholder="e.g. 45000.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${formId}-make`}
            className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            Make
          </label>
          {!customMake ? (
            <select
              id={`${formId}-make`}
              value={selectedMake}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMake(val);
                if (val === "Other") {
                  setCustomMake(true);
                  setValue("make", "");
                  setCustomModel(true); // Switch model to custom text as well
                  setSelectedModel("Other");
                  setValue("model", "");
                } else {
                  setValue("make", val, { shouldValidate: true });
                  setSelectedModel("");
                  setValue("model", "");
                }
              }}
              className="w-full p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            >
              <option value="">Select Make</option>
              {POPULAR_MAKES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="Other">Other (Type in...)</option>
            </select>
          ) : (
            <div className="relative">
              <input
                id={`${formId}-make`}
                type="text"
                value={customMakeVal}
                onChange={(e) => {
                  setCustomMakeVal(e.target.value);
                  setValue("make", e.target.value, { shouldValidate: true });
                }}
                placeholder="Type in Make..."
                className="w-full pr-20 p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomMake(false);
                  setCustomMakeVal("");
                  setSelectedMake("");
                  setValue("make", "");
                  setCustomModel(false);
                  setSelectedModel("");
                  setValue("model", "");
                }}
                className="absolute right-2 top-2.5 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Choose List
              </button>
            </div>
          )}
          {errors.make && (
            <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-model`}
            className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            Model
          </label>
          {!customModel && selectedMake !== "Other" ? (
            <select
              id={`${formId}-model`}
              value={selectedModel}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedModel(val);
                if (val === "Other") {
                  setCustomModel(true);
                  setValue("model", "");
                } else {
                  setValue("model", val, { shouldValidate: true });
                }
              }}
              disabled={!selectedMake || isLoadingModels}
              className="w-full p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            >
              <option value="">
                {isLoadingModels
                  ? "Loading models..."
                  : !selectedMake
                  ? "Select Make first"
                  : "Select Model"}
              </option>
              {nhtsaModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              {selectedMake && (
                <option value="Other">Other (Type in...)</option>
              )}
            </select>
          ) : (
            <div className="relative">
              <input
                id={`${formId}-model`}
                type="text"
                value={customModelVal}
                onChange={(e) => {
                  setCustomModelVal(e.target.value);
                  setValue("model", e.target.value, { shouldValidate: true });
                }}
                placeholder="Type in Model..."
                className="w-full pr-20 p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              />
              {selectedMake !== "Other" && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomModel(false);
                    setCustomModelVal("");
                    setSelectedModel("");
                    setValue("model", "");
                  }}
                  className="absolute right-2 top-2.5 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                >
                  Choose List
                </button>
              )}
            </div>
          )}
          {errors.model && (
            <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${formId}-trim`}
          className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5"
        >
          Trim (Optional)
        </label>
        <input
          id={`${formId}-trim`}
          {...register("trim")}
          className="w-full p-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          placeholder="e.g. GT3, Lariat, Type R"
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 dark:border-zinc-800 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition duration-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={addVehicle.isPending || updateVehicle.isPending}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-md shadow-blue-500/20"
        >
          {addVehicle.isPending || updateVehicle.isPending
            ? "Saving..."
            : isEditing
              ? "Update Vehicle"
              : "Add to Wishlist"}
        </button>
      </div>
    </form>
  );
}
