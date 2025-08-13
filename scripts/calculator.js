/***********************
 * Utility & Data Load *
 ***********************/
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const monthIndex = (name) => MONTHS_ES.findIndex(m => m.toLowerCase() === name.toLowerCase()); // 0..11

// Normalize strings for safe comparisons (lowercase, remove accents, spaces->_)
function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // strip accents
    .replace(/[.\s]+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

async function fetchJSON(file) {
  const resp = await fetch(file);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} loading ${file}`);
  return await resp.json();
}

async function loadData() {
  const [baseData, provCities] = await Promise.all([
    fetchJSON("data/Base.json"),
    fetchJSON("data/Prov_Ciudades.json"),
  ]);
  return { baseData, provCities };
}

// list of YYYY_MM columns sorted chronologically
function getSortedYMColumns(data) {
  const cols = Object.keys(data[0]).filter(k => /^\d{4}_\d{2}$/.test(k));
  return cols.sort(); // zero-padded months => lexicographic sort works
}

/***********************
 * Region resolution   *
 ***********************/
async function handleRegion(province, city, provCities) {
  const provSlug = slug(province);
  const citySlug = city ? slug(city) : "-";

  let region;

  if (provSlug === "buenos_aires") {
    const cityEntry = provCities.find(
      row => slug(row.Provincia) === "buenos_aires" && slug(row.Ciudad) === citySlug
    );
    if (!cityEntry) {
      throw new Error(`No region data found for city "${city}" in Buenos Aires`);
    }
    region = cityEntry.Region;
  } else {
    const regionEntry = provCities.find(
      row => slug(row.Provincia) === provSlug && (citySlug === "-" || slug(row.Ciudad) === citySlug)
    );
    if (!regionEntry) {
      throw new Error(`No region data found for province "${province}"`);
    }
    region = regionEntry.Region;
  }

  return region;
}

/***********************
 * Inflation math      *
 ***********************/
// From Base.json (index series): (idx2/idx1 - 1) * 100
function calculateInflation(baseData, region, yearMonthNew, yearMonthOld) {
  const entry = baseData.find(r => r.Region === region && r.Categoria === "Nivel_general");
  if (!entry) throw new Error(`No Base.json entry for region: ${region}`);
  const vNew = parseFloat(entry[yearMonthNew]);
  const vOld = parseFloat(entry[yearMonthOld]);
  if (!isFinite(vNew) || !isFinite(vOld)) throw new Error(`Missing index for ${yearMonthNew} or ${yearMonthOld}`);
  return ((vNew / vOld - 1) * 100).toFixed(2);
}

// Parse "Enero '25" -> {year: 2025, monthIdx: 0}
function parseLabel(lab) {
  const m = lab.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'(\d{2})$/);
  if (!m) return null;
  const y = 2000 + parseInt(m[2], 10);
  const mi = monthIndex(m[1]);
  if (mi < 0) return null;
  return { year: y, monthIdx: mi };
}

// Extract monthly entries from an Inf_Mensual row: [{lab,val,year,monthIdx,sortKey}]
function pickMonthlyEntries(rowObj) {
  return Object.entries(rowObj)
    .filter(([k, v]) => /^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'\d{2}$/.test(k) && typeof v === "number")
    .map(([lab, val]) => {
      const p = parseLabel(lab);
      if (!p) return null;
      return { lab, val, year: p.year, monthIdx: p.monthIdx, sortKey: p.year * 100 + (p.monthIdx + 1) };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortKey - b.sortKey);
}

// For chart: last 13 months from Inf_Mensual row
function labelToKey(label) {
  const m = label.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'(\d{2})$/);
  if (!m) return null;
  const month = MONTHS_ES.findIndex(x => x.toLowerCase() === m[1].toLowerCase()) + 1;
  const year = 2000 + parseInt(m[2], 10);
  return year * 100 + month;
}
function last13FromRow(rowObj) {
  const entries = Object.entries(rowObj)
    .filter(([k, v]) => /^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+'\d{2}$/.test(k) && typeof v === "number")
    .map(([lab, val]) => ({ lab, val, sortKey: labelToKey(lab) }))
    .filter(x => x.sortKey);
  entries.sort((a, b) => a.sortKey - b.sortKey);
  const last = entries.slice(-13);
  return {
    labels: last.map(e => e.lab),
    values: last.map(e => +(e.val * 100).toFixed(2)),
  };
}

/***********************
 * Chart               *
 ***********************/
let chartInstance;

async function renderChart(region) {
  try {
    const data = await fetchJSON("data/Inf_Mensual.json");
    const regionData = data.find(row => row.Region === region && row.Categoria === "Nivel_general");
    if (!regionData) {
      console.error("No data found for region:", region);
      alert("No se encontró información de inflación mensual para esta región.");
      return;
    }

    const { labels, values } = last13FromRow(regionData);

    // Show containers (if you hide them initially)
    const borde = document.getElementById("anana-borde-amarillo");
    const chartContainer = document.getElementById("chart-container");
    if (borde) borde.style.display = "block";
    if (chartContainer) chartContainer.style.display = "block";

    const ctx = document.getElementById("inflation-chart").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Inflación Mensual",
          data: values,
          borderColor: "#479b48",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Meses" } },
          y: {
            title: { display: true, text: "Inflación (%)" },
            beginAtZero: true,
            ticks: { stepSize: 2, callback: v => v.toString().replace(".", ",") },
          },
        },
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
        },
      },
    });
  } catch (err) {
    console.error("Error rendering chart:", err);
    alert("Hubo un error al generar el gráfico de inflación.");
  }
}

/***********************
 * DOM & Interactions  *
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  // --- Buenos Aires cities (keep as you had) ---
  const buenosAiresCities = [
    "Adolfo Alsina","Adolfo Gonzales Chaves","Alberti","Almirante Brown","Arrecifes","Avellaneda","Ayacucho","Azul","Bahía Blanca","Balcarce","Baradero","Benito Juárez","Berazategui","Berisso","Bolívar","Bragado","Brandsen","Campana","Cañuelas","Capitán Sarmiento","Carlos Casares","Carlos Tejedor","Carmen de Areco","Castelli","Chacabuco","Chascomús","Chivilcoy","Colón","Coronel de Marina Leonardo Rosales","Coronel Dorrego","Coronel Pringles","Coronel Suárez","Daireaux","Dolores","Ensenada","Escobar","Esteban Echeverría","Exaltación de la Cruz","Ezeiza","Florencio Varela","Florentino Ameghino","General Alvarado","General Alvear","General Arenales","General Belgrano","General Guido","General Juan Madariaga","General La Madrid","General Las Heras","General Lavalle","General Paz","General Pinto","General Pueyrredón","General Rodríguez","General San Martín","General Viamonte","General Villegas","Guaminí","Hipólito Yrigoyen","Hurlingham","Ituzaingó","José C. Paz","Junín","La Costa","La Matanza","La Plata","Lanús","Laprida","Las Flores","Leandro N. Alem","Lezama","Lincoln","Lobería","Lobos","Lomas de Zamora","Luján","Magdalena","Maipú","Malvinas Argentinas","Mar Chiquita","Marcos Paz","Mercedes","Merlo","Monte","Monte Hermoso","Moreno","Morón","Navarro","Necochea","Nueve de Julio","Olavarría","Patagones","Pehuajó","Pellegrini","Pergamino","Pila","Pilar","Pinamar","Presidente Perón","Puan","Punta Indio","Quilmes","Ramallo","Rauch","Rivadavia","Rojas","Roque Pérez","Saavedra","Saladillo","Salliqueló","Salto","San Andrés de Giles","San Antonio de Areco","San Cayetano","San Fernando","San Isidro","San Miguel","San Nicolás","San Pedro","San Vicente","Suipacha","Tandil","Tapalqué","Tigre","Tordillo","Tornquist","Trenque Lauquen","Tres Arroyos","Tres de Febrero","Tres Lomas","Veinticinco de Mayo","Vicente López","Villa Gesell","Villarino","Zárate"
  ];

  // Province → show city selector for BA
  document.getElementById("state").addEventListener("change", (e) => {
    const selectedState = e.target.value;
    const cityContainer = document.getElementById("city-container");
    const citySelect = document.getElementById("city");

    if (selectedState && slug(selectedState) === "buenos_aires") {
      cityContainer.style.display = "block";
      citySelect.innerHTML = "";
      buenosAiresCities.forEach((city) => {
        const option = document.createElement("option");
        option.value = slug(city); // normalized for matching
        option.textContent = city;
        citySelect.appendChild(option);
      });
    } else {
      cityContainer.style.display = "none";
      if (citySelect) citySelect.innerHTML = "";
    }
  });

  // Calculate button
  document.getElementById("calculate").addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const province = document.getElementById("state").value;
      const city = document.getElementById("city")?.value || "-";

      // Load needed data
      const { baseData, provCities } = await loadData();
      const infMensual = await fetchJSON("data/Inf_Mensual.json");

      // Resolve region
      const region = await handleRegion(province, city, provCities);

      // --- Latest month from Inf_Mensual (Nivel_general) ---
      const rowNG = infMensual.find(r => r.Region === region && r.Categoria === "Nivel_general");
      if (!rowNG) throw new Error("No Inf_Mensual Nivel_general for region " + region);
      const entries = pickMonthlyEntries(rowNG);
      if (!entries.length) throw new Error("No monthly entries in Inf_Mensual for region " + region);

      const last = entries[entries.length - 1]; // {lab, val, year, monthIdx}
      const lastMonthLabel = last.lab;
      const lastMonthInflPct = (last.val * 100).toFixed(2);

      // --- 12m interannual from Base.json: last vs same month prev year ---
      const cols = getSortedYMColumns(baseData);
      const lastMonthKey = cols[cols.length - 1];
      const sameMonthPrevYearKey = cols[cols.length - 13];
      const yearlyInflation = calculateInflation(baseData, region, lastMonthKey, sameMonthPrevYearKey);

      // --- YTD: first month of same year as last data -> last month ---
      const yearOfLast = parseInt(lastMonthKey.slice(0, 4), 10);
      const colsSameYear = cols.filter(k => k.startsWith(String(yearOfLast) + "_"));
      const firstMonthOfYearKey = colsSameYear[0];
      const ytdInflation = calculateInflation(baseData, region, lastMonthKey, firstMonthOfYearKey);

      // Update DOM (only if spans exist)
      const el = (id) => document.getElementById(id);
      if (el("last-month-label")) el("last-month-label").textContent = lastMonthLabel;
      if (el("monthly-inflation")) el("monthly-inflation").textContent = lastMonthInflPct;
      if (el("yearly-inflation")) el("yearly-inflation").textContent = yearlyInflation;
      if (el("current-year-label")) el("current-year-label").textContent = yearOfLast;
      if (el("ytd-inflation")) el("ytd-inflation").textContent = ytdInflation;

      // Show results & sections (if you hide them initially)
      if (el("results")) el("results").style.display = "block";
      if (el("anana-borde-verde")) el("anana-borde-verde").style.display = "block";
      if (el("salary-comparison-container")) el("salary-comparison-container").style.display = "block";

      // Render the chart
      await renderChart(region);

    } catch (error) {
      console.error("Error calculating inflation:", error);
      alert("Hubo un error al calcular la inflación. Por favor, verifica tus datos.");
    }
  });

  // Salary comparison
  document.getElementById("compare-salary").addEventListener("click", () => {
    const prev = parseFloat(document.getElementById("previous-salary").value);
    const curr = parseFloat(document.getElementById("current-salary").value);
    if (isNaN(prev) || isNaN(curr) || prev <= 0 || curr <= 0) {
      alert("Por favor, ingresa valores válidos para ambos salarios.");
      return;
    }

    const salaryIncrease = (curr / prev - 1); // 0.15 -> 15%
    const yearlyInflation = parseFloat(document.getElementById("yearly-inflation").textContent) / 100;
    const purchasingPower = ((1 + salaryIncrease) / (1 + yearlyInflation) - 1);

    const resultContainer = document.getElementById("salary-results");
    const resultText = document.getElementById("comparison-result");
    const resultImage = document.getElementById("result-image");
    const productPower = document.getElementById("product-power");

    if (salaryIncrease > yearlyInflation) {
      resultImage.src = "assets/Gano-PPA.png";
      resultText.innerHTML = `<strong>Felicitaciones!</strong> Lograste que tus ingresos aumenten más que la inflación.<br>
        El último año, tu sueldo se incrementó en ${(salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió ${(yearlyInflation * 100).toFixed(2)}%.`;
      productPower.textContent = `Ahora podés comprar un ${(purchasingPower * 100).toFixed(2)}% más de productos y servicios que el año pasado.`;
    } else if (Math.abs(salaryIncrease - yearlyInflation) < 1e-9) {
      resultImage.src = "assets/Empato-PPA.png";
      resultText.innerHTML = `Lograste que tus ingresos aumenten lo mismo que la inflación.<br>
        El último año, tu sueldo se incrementó en ${(salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió ${(yearlyInflation * 100).toFixed(2)}%.`;
      productPower.textContent = "Ahora podés comprar la misma cantidad de productos y servicios que el año pasado.";
    } else {
      resultImage.src = "assets/Perdio-PPA.png";
      resultText.innerHTML = `<strong>Desgraciadamente</strong>, la inflación superó tus ingresos.<br>
        El último año, tu sueldo se incrementó en ${(salaryIncrease * 100).toFixed(2)}%, mientras que la inflación subió ${(yearlyInflation * 100).toFixed(2)}%.`;
      productPower.textContent = `Ahora podés comprar un ${(Math.abs(purchasingPower) * 100).toFixed(2)}% menos de productos y servicios que el año pasado.`;
    }

    resultContainer.style.display = "block";
  });
});
