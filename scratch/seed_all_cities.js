import prisma from "../src/config/db.js";

const API_URL = "https://countriesnow.space/api/v0.1/countries/state/cities";

async function fetchCitiesForState(stateName) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state: stateName })
    });
    const json = await res.json();
    if (!json.error && Array.isArray(json.data)) {
      return json.data;
    }
    console.warn(`  ⚠️ No cities found for ${stateName}`);
    return [];
  } catch (err) {
    console.error(`  ❌ Failed to fetch cities for ${stateName}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("=== Seeding ALL Indian State Cities ===\n");

  // 1. Find the Country "India"
  const country = await prisma.country.findUnique({
    where: { name: "India" }
  });

  if (!country) {
    console.error("❌ Country 'India' not found. Run the initial seed first.");
    process.exit(1);
  }

  // 2. Get all states for India
  const states = await prisma.state.findMany({
    where: { countryId: country.id }
  });

  console.log(`Found ${states.length} states in database.\n`);

  let totalCitiesCreated = 0;
  let totalCitiesSkipped = 0;

  // 3. Loop through each state, fetch cities from API, insert into DB
  for (const state of states) {
    console.log(`📍 Processing: ${state.name}...`);

    const cities = await fetchCitiesForState(state.name);

    if (cities.length === 0) {
      console.log(`   Skipped (no cities returned)\n`);
      continue;
    }

    let created = 0;
    let skipped = 0;

    for (const cityName of cities) {
      const trimmed = cityName.trim();
      if (!trimmed) continue;

      try {
        const existing = await prisma.city.findUnique({
          where: {
            name_stateId: {
              name: trimmed,
              stateId: state.id
            }
          }
        });

        if (!existing) {
          await prisma.city.create({
            data: {
              name: trimmed,
              stateId: state.id
            }
          });
          created++;
        } else {
          skipped++;
        }
      } catch (err) {
        // Skip duplicates or other errors silently
        skipped++;
      }
    }

    console.log(`   ✅ Created: ${created}, Already existed: ${skipped}\n`);
    totalCitiesCreated += created;
    totalCitiesSkipped += skipped;

    // Small delay to avoid rate-limiting the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("========================================");
  console.log(`🎉 Seeding complete!`);
  console.log(`   Total cities created: ${totalCitiesCreated}`);
  console.log(`   Total cities skipped: ${totalCitiesSkipped}`);
  console.log("========================================");
}

main()
  .catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
