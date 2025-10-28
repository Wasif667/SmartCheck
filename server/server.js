// ⚡ OneAutoAPI Experian AutoCheck v3 (final integration)
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const apiKey = process.env.ONEAUTO_API_KEY;
  const baseUrl = process.env.ONEAUTO_API_URL || "https://api.oneautoapi.com/experian/autocheck/v3";

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OneAutoAPI key" });
  }

  const url = `${baseUrl}?vehicle_registration_mark=${plate}`;

  try {
    console.log("🌐 Fetching OneAutoAPI:", url);

    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    const text = await response.text();
    console.log("🔍 OneAutoAPI raw response:", text.slice(0, 400));

    if (!response.ok) {
      return res.status(response.status).json({ error: "OneAutoAPI error", details: text });
    }

    const data = JSON.parse(text);
    const r = data.result || {};

    const mapped = {
      summary: {
        registration: r.vehicle_registration_mark,
        make: r.dvla_manufacturer_desc,
        model: r.dvla_model_desc,
        fuelType: r.dvla_fuel_desc,
        bodyType: r.dvla_body_desc,
        transmission: r.dvla_transmission_desc,
        gears: r.number_gears,
        colour: r.colour,
        year: r.manufactured_year,
        registrationDate: r.registration_date,
        vin: r.vehicle_identification_number,
        engineNumber: r.engine_number,
        engineCapacityCC: r.engine_capacity_cc,
        co2Gkm: r.co2_gkm,
        kerbWeightKg: r.min_kerbweight_kg,
        grossWeightKg: r.gross_vehicleweight_kg,
        maxPowerKw: r.max_netpower_kw,
      },

      finance: (r.finance_data_items || []).map((f) => ({
        startDate: f.finance_start_date,
        termMonths: f.finance_term_months,
        type: f.finance_type,
        company: f.finance_company,
        contact: f.finance_company_contact_number,
        agreement: f.finance_agreement_number,
      })),

      keepers: (r.keeper_data_items || []).map((k) => ({
        previousKeepers: k.number_previous_keepers,
        lastKeeperChange: k.date_of_last_keeper_change,
      })),

      plateHistory: (r.cherished_data_items || []).map((p) => ({
        from: p.previous_vehicle_registration_mark,
        to: p.current_vehicle_registration_mark,
        date: p.cherished_plate_transfer_date,
        transferType: p.transfer_type,
      })),

      condition: (r.condition_data_items || []).map((c) => ({
        status: c.vehicle_status,
        insurer: c.insurer_name,
        claimNumber: c.insurer_claim_number,
        theftIndicator: c.theft_indicator,
        lossType: c.loss_type,
      })),

      stolen: (r.stolen_vehicle_data_items || []).map((s) => ({
        dateReported: s.date_reported,
        policeForce: s.police_force,
        isStolen: s.is_stolen,
      })),

      colourChanges: (r.colour_data_items || []).map((c) => ({
        lastColour: c.last_colour,
        dateChanged: c.date_of_last_colour_change,
      })),

      searches: (r.previous_search_items || []).map((s) => ({
        date: s.date_of_search,
        time: s.time_of_search,
        searchedBy: s.business_type_searching,
      })),

      technical: {
        soundStationaryDb: r.stationary_soundlevel_db,
        soundDrivebyDb: r.driveby_soundlevel_db,
        towingBrakedKg: r.max_braked_towing_weight_kg,
        towingUnbrakedKg: r.max_unbraked_towing_weight_kg,
      },
    };

    res.json(mapped);
  } catch (error) {
    console.error("🔥 OneAutoAPI fetch error:", error);
    res.status(500).json({
      error: "Server error fetching OneAutoAPI data",
      details: error.message,
    });
  }
});
