const BASE_URL = "http://localhost:5000/api/master";

async function test() {
  console.log("=== Testing API Endpoints ===");

  // 1. GET Countries
  const getCountriesRes = await fetch(`${BASE_URL}/countries`);
  const countriesData = await getCountriesRes.json();
  console.log("GET /countries response status:", getCountriesRes.status);
  console.log("GET /countries data:", JSON.stringify(countriesData.data, null, 2));

  // 2. GET States for India
  const getStatesRes = await fetch(`${BASE_URL}/states?country=India`);
  const statesData = await getStatesRes.json();
  console.log("GET /states?country=India response status:", getStatesRes.status);
  console.log(`GET /states count: ${statesData.data.length}`);
  const telangana = statesData.data.find(s => s.name === "Telangana");
  console.log("Telangana state record found:", telangana);

  // 3. GET Cities for Telangana
  const getCitiesRes = await fetch(`${BASE_URL}/cities?state=Telangana`);
  const citiesData = await getCitiesRes.json();
  console.log("GET /cities?state=Telangana response status:", getCitiesRes.status);
  console.log(`GET /cities count: ${citiesData.data.length}`);
  console.log("Sample city (first 3):", citiesData.data.slice(0, 3));

  // 4. POST Create a country (test duplication handling)
  const postCountryRes = await fetch(`${BASE_URL}/countries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "USA" })
  });
  const newCountryData = await postCountryRes.json();
  console.log("POST /countries (USA) response status:", postCountryRes.status);
  console.log("POST /countries data:", newCountryData);

  // 5. POST Create a state (test duplication handling)
  const postStateRes = await fetch(`${BASE_URL}/states`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country: "USA", name: "California" })
  });
  const newStateData = await postStateRes.json();
  console.log("POST /states (California) response status:", postStateRes.status);
  console.log("POST /states data:", newStateData);

  // 6. POST Create a city (test duplication handling)
  const postCityRes = await fetch(`${BASE_URL}/cities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "California", name: "Los Angeles" })
  });
  const newCityData = await postCityRes.json();
  console.log("POST /cities (Los Angeles) response status:", postCityRes.status);
  console.log("POST /cities data:", newCityData);

  // Clean up test data (optional, but good practice to verify)
  console.log("=== API Testing Completed ===");
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
