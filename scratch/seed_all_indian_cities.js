import prisma from "../src/config/db.js";

async function main() {
  console.log("=== Seeding ALL Indian State Cities ===");

  // 1. Find Country "India"
  const country = await prisma.country.findUnique({
    where: { name: "India" }
  });

  if (!country) {
    console.error("Country India not found in DB! Run seed_states_cities.js first.");
    return;
  }

  // 2. Get all states
  const states = await prisma.state.findMany({
    where: { countryId: country.id }
  });

  console.log(`\nFound ${states.length} states in database.\n`);

  for (const state of states) {
    console.log(`📍 Processing: ${state.name}...`);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          country: "India",
          state: state.name
        })
      });

      const json = await response.json();

      if (json.error) {
        console.log(`   ❌ API Error for ${state.name}: ${json.msg}`);
        continue;
      }

      const cities = json.data;
      if (!cities || cities.length === 0) {
        console.log(`   ⚠️ No cities found for ${state.name}`);
        continue;
      }

      let created = 0;
      let existing = 0;

      for (const cityName of cities) {
        let city = await prisma.city.findUnique({
          where: {
            name_stateId: {
              name: cityName,
              stateId: state.id
            }
          }
        });

        if (!city) {
          await prisma.city.create({
            data: {
              name: cityName,
              stateId: state.id
            }
          });
          created++;
        } else {
          existing++;
        }
      }

      console.log(`   ✅ Created: ${created}, Already existed: ${existing}`);

    } catch (err) {
      console.error(`   🚨 Failed to process ${state.name}:`, err.message);
    }
    
    // Add a small delay to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n🎉 All states processed successfully!");
}

main()
  .catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
