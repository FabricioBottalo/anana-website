// Function to determine the region
async function handleRegion(province, city, provCities) {
  let region;

  if (province === "buenos_aires") {
    // Special case for Buenos Aires cities
    const cityEntry = provCities.find(
      (row) => row.Provincia === "buenos_aires" && row.Ciudad === city.toLowerCase().replace(/\s+/g, "_")
    );

    console.log("Selected Province:", province);
    console.log("Selected City:", city);
    console.log("Matching City Entry:", cityEntry);

    if (!cityEntry) {
      throw new Error(`No region data found for city: ${city} in Buenos Aires`);
    }

    region = cityEntry.Region;

  } else {
    // Standard case for other provinces
    const regionEntry = provCities.find(
      (row) => row.Provincia.toLowerCase().replace(/\s+/g, "_") === province && (city === "-" || row.Ciudad === city)
    );

    if (!regionEntry) {
      throw new Error(`No region data found for province: ${province}`);
    }

    region = regionEntry.Region;
  }



  console.log("Determined Region:", region);


  return region;
}

// Function to calculate inflation
function calculateInflation(data, region, yearMonth1, yearMonth2) {
  const entry = data.find(
    (row) => row.Region === region && row.Categoria === "Nivel_general"
  );

  if (!entry) {
    throw new Error(`No data found for region: ${region}`);
  }

  const value1 = parseFloat(entry[yearMonth1]);
  const value2 = parseFloat(entry[yearMonth2]);

  return ((value1 / value2 - 1) * 100).toFixed(2); // Convert to percentage
}

// Utility functions to load data
async function fetchJSON(file) {
  const response = await fetch(file);
  return await response.json();
}

async function loadData() {
  const baseData = await fetchJSON("data/Base.json");
  const provCities = await fetchJSON("data/Prov_Ciudades.json");
  return { baseData, provCities };
}

function getLastColumn(data) {
  const columns = Object.keys(data[0]).filter((key) => key.startsWith("20"));
  return columns.sort(); // Sort chronologically
}



// Event listener for the Calculate button
document.addEventListener("DOMContentLoaded", () => {
  // City data for Buenos Aires
  const buenosAiresCities = [
    "Adolfo Alsina", "Adolfo Gonzales Chaves", "Alberti", "Almirante Brown", "Arrecifes",
    "Avellaneda", "Ayacucho", "Azul", "Bahía Blanca", "Balcarce", "Baradero", "Benito Juárez",
    "Berazategui", "Berisso", "Bolívar", "Bragado", "Brandsen", "Campana", "Cañuelas",
    "Capitán Sarmiento", "Carlos Casares", "Carlos Tejedor", "Carmen de Areco", "Castelli",
    "Chacabuco", "Chascomús", "Chivilcoy", "Colón", "Coronel de Marina Leonardo Rosales",
    "Coronel Dorrego", "Coronel Pringles", "Coronel Suárez", "Daireaux", "Dolores", "Ensenada",
    "Escobar", "Esteban Echeverría", "Exaltación de la Cruz", "Ezeiza", "Florencio Varela",
    "Florentino Ameghino", "General Alvarado", "General Alvear", "General Arenales",
    "General Belgrano", "General Guido", "General Juan Madariaga", "General La Madrid",
    "General Las Heras", "General Lavalle", "General Paz", "General Pinto", "General Pueyrredón",
    "General Rodríguez", "General San Martín", "General Viamonte", "General Villegas", "Guaminí",
    "Hipólito Yrigoyen", "Hurlingham", "Ituzaingó", "José C. Paz", "Junín", "La Costa",
    "La Matanza", "La Plata", "Lanús", "Laprida", "Las Flores", "Leandro N. Alem", "Lezama",
    "Lincoln", "Lobería", "Lobos", "Lomas de Zamora", "Luján", "Magdalena", "Maipú",
    "Malvinas Argentinas", "Mar Chiquita", "Marcos Paz", "Mercedes", "Merlo", "Monte",
    "Monte Hermoso", "Moreno", "Morón", "Navarro", "Necochea", "Nueve de Julio", "Olavarría",
    "Patagones", "Pehuajó", "Pellegrini", "Pergamino", "Pila", "Pilar", "Pinamar",
    "Presidente Perón", "Puan", "Punta Indio", "Quilmes", "Ramallo", "Rauch", "Rivadavia",
    "Rojas", "Roque Pérez", "Saavedra", "Saladillo", "Salliqueló", "Salto", "San Andrés de Giles",
    "San Antonio de Areco", "San Cayetano", "San Fernando", "San Isidro", "San Miguel",
    "San Nicolás", "San Pedro", "San Vicente", "Suipacha", "Tandil", "Tapalqué", "Tigre",
    "Tordillo", "Tornquist", "Trenque Lauquen", "Tres Arroyos", "Tres de Febrero", "Tres Lomas",
    "Veinticinco de Mayo", "Vicente López", "Villa Gesell", "Villarino", "Zárate"
  ];

  
  document.getElementById("state").addEventListener("change", (e) => {
    const selectedState = e.target.value;
    const cityContainer = document.getElementById("city-container");
    const citySelect = document.getElementById("city");

    if (selectedState === "buenos_aires") {
      cityContainer.style.display = "block";
      citySelect.innerHTML = ""; // Clear existing options
      buenosAiresCities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city.toLowerCase().replace(/\s+/g, "_");;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    } else {
      cityContainer.style.display = "none";
    }


  });



  document.getElementById("calculate").addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const province = document.getElementById("state").value;
      const city = document.getElementById("city")?.value || "-";

      // Load data
      const { baseData, provCities } = await loadData();

      // Determine the region
      const region = await handleRegion(province, city, provCities);

      // Get sorted columns for calculations
      const sortedColumns = getLastColumn(baseData);
      const [firstMonthOfYear, lastMonth, previousMonth, lastYearSameMonth] = [
        sortedColumns[sortedColumns.length - 2], //Este va cambiando
        sortedColumns[sortedColumns.length - 1],
        sortedColumns[sortedColumns.length - 2],
        sortedColumns[sortedColumns.length - 13]
      ];

      // Calculate inflation
      const monthlyInflation = calculateInflation(
        baseData,
        region,
        lastMonth,
        previousMonth
      );
      const yearlyInflation = calculateInflation(
        baseData,
        region,
        lastMonth,
        lastYearSameMonth
      );
      const ytdInflation = calculateInflation(
        baseData,
        region,
        lastMonth,
        firstMonthOfYear
      );

      // Display results
      document.getElementById("monthly-inflation").textContent = monthlyInflation;
      document.getElementById("yearly-inflation").textContent = yearlyInflation;
      document.getElementById("ytd-inflation").textContent = ytdInflation;

      document.getElementById("results").style.display = "block";
    } catch (error) {
      console.error("Error calculating inflation:", error);
      alert("Hubo un error al calcular la inflación. Por favor, verifica tus datos.");
    }
  });

});




// --- Helpers (put near the top of calculator.js) ---
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const monthIndex = (name) => MONTHS_ES.findIndex(m => m.toLowerCase() === name.toLowerCase()); // 0..11

function parseLabel(lab) {
  // "Enero '25" -> { year: 2025, monthIdx: 0 }  (0-based month)
  const m = lab.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'(\d{2})$/);
  if (!m) return null;
  const y = 2000 + parseInt(m[2], 10);
  const mi = monthIndex(m[1]);
  if (mi < 0) return null;
  return { year: y, monthIdx: mi };

function pickMonthlyEntries(rowObj) {
  // returns [{lab, val, year, monthIdx, sortKey}]
  return Object.entries(rowObj)
    .filter(([k, v]) => /^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'\d{2}$/.test(k) && typeof v === "number")
    .map(([lab, val]) => {
      const parsed = parseLabel(lab);
      if (!parsed) return null;
      const sortKey = parsed.year * 100 + (parsed.monthIdx + 1);
      return { lab, val, ...parsed, sortKey };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortKey - b.sortKey);
}

const fmtPct = (x) => (x*100).toFixed(2).replace(".", ",");      // 0.0162 -> "1,62"
const fmtPctNumber = (x) => +(x*100).toFixed(2);                  // 0.0162 -> 1.62 (number)
const productMinus1 = (arr) => arr.reduce((acc, r) => acc * (1 + r.val), 1) - 1;

function labelToKey(label) {
  // "Enero '25" -> sortable key 202501
  const m = label.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'(\d{2})$/);
  if (!m) return null;
  const month = MONTHS_ES.findIndex(x => x.toLowerCase() === m[1].toLowerCase()) + 1;
  const year = 2000 + parseInt(m[2], 10);
  return year * 100 + month; // e.g., 202501
}

function last13FromRow(rowObj) {
  // pick only keys like "Mes 'YY" that have numeric values
  const entries = Object.entries(rowObj)
    .filter(([k, v]) => /^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'\d{2}$/.test(k) && typeof v === "number")
    .map(([lab, val]) => ({ lab, val, sortKey: labelToKey(lab) }))
    .filter(x => x.sortKey);

  // sort chronologically and take last 13
  entries.sort((a, b) => a.sortKey - b.sortKey);
  const last = entries.slice(-13);

  return {
    labels: last.map(e => e.lab),
    values: last.map(e => +(e.val * 100).toFixed(2)), // percent
  };
}

// --- CHART ---
let chartInstance; // keep your global

async function renderChart(region) {
  try {
    const data = await fetchJSON("data/Inf_Mensual.json");

    const regionData = data.find(
      (row) => row.Region === region && row.Categoria === "Nivel_general"
    );

    if (!regionData) {
      console.error("No data found for region:", region);
      alert("No se encontró información de inflación mensual para esta región.");
      return;
    }

    // NEW: auto-pick the last 13 months from available keys
    const { labels, values } = last13FromRow(regionData);

    // Show containers
    document.getElementById("anana-borde-amarillo").style.display = "block";
    document.getElementById("chart-container").style.display = "block";

    const ctx = document.getElementById("inflation-chart").getContext("2d");

    // Destroy existing chart instance if it exists
    if (chartInstance) chartInstance.destroy();

    // Create a new chart
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Inflación Mensual",
            data: values,
            borderColor: "#479b48",
            borderWidth: 3,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Meses" },
          },
          y: {
            title: { display: true, text: "Inflación (%)" },
            beginAtZero: true,
            ticks: {
              // keep your step if you like; or format with % sign:
              stepSize: 2,
              callback: (v) => v.toString().replace(".", ","),
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}%`,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error rendering chart:", error);
    alert("Hubo un error al generar el gráfico de inflación.");
  }
}




// Add event listener for Calculate button
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("calculate").addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const province = document.getElementById("state").value;
      const city = document.getElementById("city")?.value || "-";

      // Load province-to-region mapping data
      const provCities = await fetchJSON("data/Prov_Ciudades.json");

      // Determine the region
      const region = await handleRegion(province, city, provCities);

      // Perform calculations (existing logic for inflation results)
      // ...

      // Render the inflation chart
      await renderChart(region);
    } catch (error) {
      console.error("Error calculating inflation:", error);
      alert("Hubo un error al calcular la inflación. Por favor, verifica tus datos.");
    }
  });
});





document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("calculate").addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const province = document.getElementById("state").value;
      const city = document.getElementById("city")?.value || "-";

      // Load province-to-region mapping data
      const provCities = await fetchJSON("data/Prov_Ciudades.json");

      // Determine the region
      const region = await handleRegion(province, city, provCities);

      // Perform calculations (existing logic for inflation results)
      // ...

      // Render the inflation chart
      await renderChart(region);

      // Show the salary comparison section
      document.getElementById("anana-borde-verde").style.display = "block";
      document.getElementById("salary-comparison-container").style.display = "block";
    } catch (error) {
      console.error("Error calculating inflation:", error);
      alert("Hubo un error al calcular la inflación. Por favor, verifica tus datos.");
    }
  });

  // Salary comparison logic
  document.getElementById("compare-salary").addEventListener("click", () => {
    // Get user inputs
    const previousSalary = parseFloat(document.getElementById("previous-salary").value);
    const currentSalary = parseFloat(document.getElementById("current-salary").value);

    if (isNaN(previousSalary) || isNaN(currentSalary) || previousSalary <= 0 || currentSalary <= 0) {
      alert("Por favor, ingresa valores válidos para ambos salarios.");
      return;
    }

    // Calculate salary increase
    const salaryIncrease = (currentSalary / previousSalary - 1).toFixed(2);

    // Get yearly inflation (assume it's already calculated elsewhere)
    const yearlyInflation = parseFloat(document.getElementById("yearly-inflation").textContent) / 100;

    // Calculate purchasing power
    const purchasingPower = ((1 + parseFloat(salaryIncrease)) / (1 + yearlyInflation) - 1).toFixed(2);

    // Display results
    const resultContainer = document.getElementById("salary-results");
    const resultText = document.getElementById("comparison-result");
    const resultImage = document.getElementById("result-image");
    const productPower = document.getElementById("product-power");

    if (salaryIncrease > yearlyInflation) {
      resultImage.src = "assets/Gano-PPA.png"; // Full basket image

      resultText.innerHTML = `
        <strong>Felicitaciones!</strong> Lograste que tus ingresos aumenten más que la inflación.<br>
        El último año, tu sueldo se incrementó en un ${(+salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió un ${(yearlyInflation * 100).toFixed(2)}%.
      `;

      productPower.textContent = `Ahora podés comprar un ${(purchasingPower * 100).toFixed(2)}% más de productos y servicios que el año pasado.`;
    } else if (salaryIncrease === yearlyInflation) {
      resultImage.src = "assets/Empato-PPA.png"; // Same basket image

      resultText.innerHTML = `
        Lograste que tus ingresos aumenten lo mismo que la inflación.<br>
        El último año, tu sueldo se incrementó en un ${(+salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió un ${(yearlyInflation * 100).toFixed(2)}%.
      `;
      
      productPower.textContent = "Ahora podés comprar la misma cantidad de productos y servicios que el año pasado.";
    } else {
      resultImage.src = "assets/Perdio-PPA.png"; // Empty basket image

      resultText.innerHTML = `
        <strong>Desgraciadamente</strong>, la inflación superó tus ingresos el 2024.<br>
        El último año, tu sueldo se incrementó en un ${(+salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió un ${(yearlyInflation * 100).toFixed(2)}%.
      `;
      
      productPower.textContent = `Ahora podés comprar un ${(Math.abs(purchasingPower) * 100).toFixed(2)}% menos de productos y servicios que el año pasado.`;
    }

    // Show the results
    resultContainer.style.display = "block";
  });
});
