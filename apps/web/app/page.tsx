import { db, vehicles, eq } from "@wishlist/db";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { VehicleForm } from "../components/vehicle-form";
import { VehicleList } from "../components/vehicle-list";

export default async function Home() {
  const { userId } = await auth();

  const rawVehicles = userId
    ? await db.select().from(vehicles).where(eq(vehicles.userId, userId))
    : [];

  const allVehicles = rawVehicles.map(v => ({
    ...v,
    price: v.price ? v.price / 100 : null
  }));

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex border-b pb-6 mb-8">
        <h1 className="text-4xl font-bold">Vehicle Wishlist</h1>
        <div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton showName />
          </Show>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Vehicles</h2>
          {!userId ? (
            <p className="text-gray-500">Please sign in to see your wishlist.</p>
          ) : (
            <VehicleList initialVehicles={allVehicles} />
          )}
        </div>

        <Show when="signed-in">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Add New Vehicle</h2>
            <VehicleForm />
          </div>
        </Show>
      </div>
    </main>
  );
}
