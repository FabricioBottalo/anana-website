document.addEventListener("DOMContentLoaded", function () {
    const ratesList = document.getElementById("rates-list");
    const categoryButtons = document.querySelectorAll(".category-button");

    let assetsData = [];

    async function fetchRates() {
        try {
            const response = await fetch("data/Rates.json");
            assetsData = await response.json();
            console.log("Fetched data:", assetsData);
            updateTable("todos");
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    function updateTable(selectedCategory) {
        ratesList.innerHTML = ""; // Clear previous results

        let filteredAssets = assetsData.filter(asset => {
            if (selectedCategory === "todos") return true;
            if (selectedCategory === "plazos_fijos" && asset.Category === "Banco") return true;
            if (selectedCategory === "billeteras" && asset.Category === "Billetera") return true;
            if (selectedCategory === "otros_activos" && asset.Category === "Otros Activos") return true;
            return false;
        });

        // Sort assets by TEM (descending order)
        filteredAssets.sort((a, b) => b.TEM - a.TEM);

        filteredAssets.forEach(asset => {
            const card = document.createElement("div");
            card.classList.add("rate-card");

            const normalizeName = asset.Commercial_Name
                .normalize("NFD").replace(/[\u0300-\u036f]/g, '')  // Remove accents
                .toLowerCase()                                      // Convert to lowercase
              .replace(/\s+/g, '_')                               // Replace spaces with underscores
               .replace(/[^a-z0-9_]/g, '');                        // Remove special characters

            const logoPath = `assets/LOGOS/${normalizeName}.png`;
            console.log("Checking logo path:", logoPath); // Debugging
            const logo = document.createElement("img");
            logo.src = logoPath;
            logo.alt = asset.Commercial_Name;
            logo.classList.add("logo");


            const name = document.createElement("span");
            name.textContent = asset.Commercial_Name;
            name.classList.add("name");

            const anr = document.createElement("div");
            anr.classList.add("rate");
            anr.innerHTML = `<strong>${asset.TNA.toFixed(2)}%</strong>`;

            const tnaname = document.createElement("span")
            tnaname.textContent = "TNA        -         "

            const mer = document.createElement("div");
            mer.classList.add("rate");
            mer.innerHTML = `<strong>${asset.TEM.toFixed(2)}%</strong>`;

            const temname = document.createElement("span")
            temname.textContent = "TEM"

            // Tag Column
            const limitTag = document.createElement("span");
            limitTag.textContent = asset.Tags;
            limitTag.classList.add("tag-container");
            


            // Append elements to the card
            card.appendChild(logo);
            card.appendChild(name);
            card.appendChild(anr);
            card.appendChild(mer);
            name.appendChild(limitTag);
            anr.appendChild(tnaname);
            mer.appendChild(temname);

            // Append card to the list
            ratesList.appendChild(card);
        });

        console.log(`Updated list with ${filteredAssets.length} items`);
    }

    categoryButtons.forEach(button => {
        button.addEventListener("click", function () {
            categoryButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            updateTable(this.getAttribute("data-category"));
        });
    });

    fetchRates();
});
