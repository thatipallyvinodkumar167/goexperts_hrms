import prisma from "../src/config/db.js";

const statesData = [
  { "name": "Andaman and Nicobar Islands" },
  { "name": "Andhra Pradesh" },
  { "name": "Arunachal Pradesh" },
  { "name": "Assam" },
  { "name": "Bihar" },
  { "name": "Chandigarh" },
  { "name": "Chhattisgarh" },
  { "name": "Dadra and Nagar Haveli" },
  { "name": "Daman and Diu" },
  { "name": "Delhi" },
  { "name": "Goa" },
  { "name": "Gujarat" },
  { "name": "Haryana" },
  { "name": "Himachal Pradesh" },
  { "name": "Jammu and Kashmir" },
  { "name": "Jharkhand" },
  { "name": "Karnataka" },
  { "name": "Kerala" },
  { "name": "Ladakh" },
  { "name": "Lakshadweep" },
  { "name": "Madhya Pradesh" },
  { "name": "Maharashtra" },
  { "name": "Manipur" },
  { "name": "Meghalaya" },
  { "name": "Mizoram" },
  { "name": "Nagaland" },
  { "name": "Odisha" },
  { "name": "Puducherry" },
  { "name": "Punjab" },
  { "name": "Rajasthan" },
  { "name": "Sikkim" },
  { "name": "Tamil Nadu" },
  { "name": "Telangana" },
  { "name": "Tripura" },
  { "name": "Uttar Pradesh" },
  { "name": "Uttarakhand" },
  { "name": "West Bengal" }
];

const telanganaCities = [
  "Ādilābād",
  "Ālampur",
  "Andol",
  "Asifābād",
  "Bālāpur",
  "Bānswāda",
  "Bellampalli",
  "Bhadrāchalam",
  "Bhadradri Kothagudem",
  "Bhaisa",
  "Bhongīr",
  "Bodhan",
  "Chandūr",
  "Chātakonda",
  "Dasnapur",
  "Devarkonda",
  "Dornakal",
  "Farrukhnagar",
  "Gaddi Annaram",
  "Gadwāl",
  "Ghatkesar",
  "Gopālur",
  "Gūdūr",
  "Hyderābād",
  "Jagitial",
  "Jagtiāl",
  "Jangaon",
  "Jangoan",
  "Jayashankar Bhupalapally",
  "Jogulamba Gadwal",
  "Kagaznāgār",
  "Kāmāreddi",
  "Kamareddy",
  "Karīmnagar",
  "Khammam",
  "Kodār",
  "Koratla",
  "Kothāpet",
  "Kottagūdem",
  "Kottapalli",
  "Kūkatpalli",
  "Kyathampalle",
  "Lakshettipet",
  "Lal Bahadur Nagar",
  "Mahabubabad",
  "Mahbūbābād",
  "Mahbūbnagar",
  "Malkajgiri",
  "Mancherāl",
  "Mandamarri",
  "Manthani",
  "Manuguru",
  "Medak",
  "Medchal",
  "Medchal Malkajgiri",
  "Miriālgūda",
  "Nāgar Karnūl",
  "Nalgonda",
  "Nārāyanpet",
  "Nārsingi",
  "Nāspur",
  "Nirmal",
  "Nizamabad",
  "Nizāmābād",
  "Pāloncha",
  "Palwancha",
  "Patancheru",
  "Peddapalli",
  "Quthbullapur",
  "Rajanna Sircilla",
  "Ramagundam",
  "Rāmgundam",
  "Rangareddi",
  "Sadāseopet",
  "Sangāreddi",
  "Sathupalli",
  "Secunderabad",
  "Serilingampalle",
  "Siddipet",
  "Singāpur",
  "Sirpur",
  "Sirsilla",
  "Srīrāmnagar",
  "Suriāpet",
  "Tāndūr",
  "Uppal Kalan",
  "Vemalwāda",
  "Vikārābād",
  "Wanparti",
  "Warangal",
  "Yellandu",
  "Zahirābād"
];

async function main() {
  console.log("Seeding country, states and cities...");

  // 1. Create or Find Country "India"
  let country = await prisma.country.findUnique({
    where: { name: "India" }
  });

  if (!country) {
    country = await prisma.country.create({
      data: { name: "India" }
    });
    console.log("Created Country: India");
  } else {
    console.log("Country India already exists");
  }

  // 2. Create States
  let statesCreatedCount = 0;
  let statesExistingCount = 0;

  for (const stateData of statesData) {
    let state = await prisma.state.findUnique({
      where: {
        name_countryId: {
          name: stateData.name,
          countryId: country.id
        }
      }
    });

    if (!state) {
      state = await prisma.state.create({
        data: {
          name: stateData.name,
          countryId: country.id
        }
      });
      statesCreatedCount++;
    } else {
      statesExistingCount++;
    }
  }

  console.log(`States processing done: Created ${statesCreatedCount}, Already existed ${statesExistingCount}`);

  // 3. Create Cities for Telangana
  const telanganaState = await prisma.state.findFirst({
    where: { name: "Telangana" }
  });

  if (!telanganaState) {
    throw new Error("Telangana state record was not found after state insertion!");
  }

  let citiesCreatedCount = 0;
  let citiesExistingCount = 0;

  for (const cityName of telanganaCities) {
    let city = await prisma.city.findUnique({
      where: {
        name_stateId: {
          name: cityName,
          stateId: telanganaState.id
        }
      }
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          name: cityName,
          stateId: telanganaState.id
        }
      });
      citiesCreatedCount++;
    } else {
      citiesExistingCount++;
    }
  }

  console.log(`Cities of Telangana processing done: Created ${citiesCreatedCount}, Already existed ${citiesExistingCount}`);
  console.log("Database seeding completed successfully! 🎉");
}

main()
  .catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
