import { appRouter } from "./src/router";
import { db } from "@wishlist/db";

async function run() {
  const caller = appRouter.createCaller({
    db: db as any,
    userId: "test",
    headers: new Headers(),
  });

  const start1 = performance.now();
  await caller.getModelsForMake({ make: "honda", year: 2020 });
  const end1 = performance.now();
  console.log(`First call took: ${end1 - start1} ms`);

  const start2 = performance.now();
  await caller.getModelsForMake({ make: "honda", year: 2020 });
  const end2 = performance.now();
  console.log(`Second call took: ${end2 - start2} ms`);

  const start3 = performance.now();
  await caller.getModelsForMake({ make: "toyota", year: 2022 });
  const end3 = performance.now();
  console.log(`Third call took: ${end3 - start3} ms`);

  const start4 = performance.now();
  await caller.getModelsForMake({ make: "toyota", year: 2022 });
  const end4 = performance.now();
  console.log(`Fourth call took: ${end4 - start4} ms`);
}

run().catch(console.error);
