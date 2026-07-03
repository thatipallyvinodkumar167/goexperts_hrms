import prisma from "../config/db.js";

// ==========================================
// 🌍 COUNTRY CONTROLLERS
// ==========================================

// POST /api/master/countries
export const createCountry = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Country name is required" });
    }

    const trimmedName = name.trim();

    // Find or create country
    let country = await prisma.country.findUnique({
      where: { name: trimmedName }
    });

    if (!country) {
      country = await prisma.country.create({
        data: { name: trimmedName }
      });
    }

    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: country
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/master/countries
export const getCountries = async (req, res) => {
  try {
    const countries = await prisma.country.findMany();
    res.status(200).json({ success: true, data: countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 🏛️ STATE CONTROLLERS
// ==========================================

// POST /api/master/states
export const createState = async (req, res) => {
  try {
    const { country, name } = req.body;
    if (!country || !name) {
      return res.status(400).json({ success: false, message: "Both country and state name are required" });
    }

    const trimmedCountry = country.trim();
    const trimmedState = name.trim();

    const countryRecord = await prisma.country.findUnique({
      where: { name: trimmedCountry }
    });

    if (!countryRecord) {
      return res.status(400).json({
        success: false,
        message: `Country '${trimmedCountry}' not found. Please create the country first.`
      });
    }

    // Find or create state
    let stateRecord = await prisma.state.findUnique({
      where: {
        name_countryId: {
          name: trimmedState,
          countryId: countryRecord.id
        }
      }
    });

    if (!stateRecord) {
      stateRecord = await prisma.state.create({
        data: {
          name: trimmedState,
          countryId: countryRecord.id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "State created successfully",
      data: stateRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/master/states
export const getStates = async (req, res) => {
  try {
    const { country } = req.query;
    if (!country) {
      return res.status(400).json({ success: false, message: "country query parameter is required" });
    }

    const trimmedCountry = country.trim();

    const countryRecord = await prisma.country.findUnique({
      where: { name: trimmedCountry }
    });

    if (!countryRecord) {
      return res.status(200).json({ success: true, data: [] });
    }

    const states = await prisma.state.findMany({
      where: { countryId: countryRecord.id }
    });

    res.status(200).json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 🏙️ CITY CONTROLLERS
// ==========================================

// POST /api/master/cities
export const createCity = async (req, res) => {
  try {
    const { state, name } = req.body;
    if (!state || !name) {
      return res.status(400).json({ success: false, message: "Both state and city name are required" });
    }

    const trimmedState = state.trim();
    const trimmedCity = name.trim();

    const stateRecord = await prisma.state.findFirst({
      where: { name: trimmedState }
    });

    if (!stateRecord) {
      return res.status(400).json({
        success: false,
        message: `State '${trimmedState}' not found. Please create the state first.`
      });
    }

    // Find or create city
    let cityRecord = await prisma.city.findUnique({
      where: {
        name_stateId: {
          name: trimmedCity,
          stateId: stateRecord.id
        }
      }
    });

    if (!cityRecord) {
      cityRecord = await prisma.city.create({
        data: {
          name: trimmedCity,
          stateId: stateRecord.id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: cityRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/master/cities
export const getCities = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ success: false, message: "state query parameter is required" });
    }

    const trimmedState = state.trim();

    const stateRecord = await prisma.state.findFirst({
      where: { name: trimmedState }
    });

    if (!stateRecord) {
      return res.status(200).json({ success: true, data: [] });
    }

    const cities = await prisma.city.findMany({
      where: { stateId: stateRecord.id }
    });

    res.status(200).json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/master/cities/:id
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "City name is required" });
    const updated = await prisma.city.update({
      where: { id },
      data: { name: name.trim() }
    });
    res.status(200).json({ success: true, message: "City updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/master/cities/:id
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.city.delete({ where: { id } });
    res.status(200).json({ success: true, message: "City deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Cannot delete city, it might be in use." });
  }
};
// PUT /api/master/countries/:id
export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Country name is required" });
    const updated = await prisma.country.update({
      where: { id },
      data: { name: name.trim() }
    });
    res.status(200).json({ success: true, message: "Country updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/master/countries/:id
export const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.country.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Country deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Cannot delete country, it might be in use." });
  }
};

// PUT /api/master/states/:id
export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "State name is required" });
    const updated = await prisma.state.update({
      where: { id },
      data: { name: name.trim() }
    });
    res.status(200).json({ success: true, message: "State updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/master/states/:id
export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.state.delete({ where: { id } });
    res.status(200).json({ success: true, message: "State deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Cannot delete state, it might be in use." });
  }
};
