document.addEventListener("DOMContentLoaded", function () {
    const ratesList = document.getElementById("rates-list");
    const categoryButtons = document.querySelectorAll(".category-button");
    const includeNoClientCheckbox = document.getElementById("no-include-no-client");
    const noInterestLimitCheckbox = document.getElementById("no-interest-limit");
    const excludeDifferentialCheckbox = document.getElementById("exclude-differential");

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
            if (selectedCategory === "todos" && asset.Category !== "FCI_Dolar") return true;
            if (selectedCategory === "plazos_fijos" && asset.Category === "Banco") return true;
            if (selectedCategory === "billeteras" && asset.Category === "Billetera") return true;
            if (selectedCategory === "otros_activos" && asset.Category === "Otros Activos") return true;
            if (selectedCategory === "fci_usd" && asset.Category === "FCI_Dolar") return true;
            return false;
        });

        // Apply Additional Filters 
        if (includeNoClientCheckbox.checked) {
            filteredAssets = filteredAssets.filter(asset => !asset.Commercial_Name.includes("NO CLIENTE"));
        }

        if (noInterestLimitCheckbox.checked) {
            filteredAssets = filteredAssets.filter(asset =>
                !["UALÁ", "NARANJA X", "NARANJA X (FRASCO A 14 DÍAS)", "NARANJA X (FRASCO A 28 DÍAS)", "BICA (CUENTA POSITIVA)"].includes(asset.Commercial_Name)
            );
        }
        if (excludeDifferentialCheckbox.checked) {
            filteredAssets = filteredAssets.filter(asset =>
                !["PERSONAL PAY (NIVEL 2)", "PERSONAL PAY (NIVEL 3)", "BRUBANK (PF BRUPLUS)"].includes(asset.Commercial_Name)
            );
        }
           

        // Sort assets by TEM (descending order)
        filteredAssets.sort((a, b) => b.TEM - a.TEM);

        filteredAssets.forEach(asset => {
            const card = document.createElement("div");
            card.classList.add("rate-card");

            const logo = document.createElement("img");
            logo.src = `assets/LOGOS/${asset.Commercial_Name.replace(/\s+/g, '_').replace(/Ó/g, "O").replace(/É/g, "E").replace(/Á/g, "A").replace(/Í/g, "I").toUpperCase()}.png`;
            logo.classList.add("logo");

            const name = document.createElement("span");
            name.textContent = asset.Commercial_Name;
            name.classList.add("name");

            const anr = document.createElement("div");
            anr.classList.add("rate");
            //anr.innerHTML = `<strong>${asset.TNA.toFixed(2)}%</strong>`;
            anr.innerHTML = `<strong>${asset.TNA.toFixed(2)}%</strong><br><span>TNA</span>`;

            //const tnaname = document.createElement("span")
            //tnaname.textContent = "TNA        ;         "

            const mer = document.createElement("div");
            mer.classList.add("rate");
            mer.innerHTML = `<strong>${asset.TEM.toFixed(2)}%</strong><br><span>TEM</span>`;

            //const temname = document.createElement("span")
            //temname.textContent = "TEM"

            // Tag Column
            const tagContainer = document.createElement("div");
            tagContainer.classList.add("tag-container");    
            // Ensure Tags is an array
            let tagsArray = asset.Tags;
            if (typeof asset.Tags === "string") {
                try {
                    tagsArray = JSON.parse(asset.Tags); 
                } catch (error) {
                    console.error("Error parsing Tags:", error);
                    tagsArray = []; 
                }
            }
            
            // Check if there are tags to display
            if (Array.isArray(tagsArray) && tagsArray.length > 0) {
                tagsArray.forEach((tagText, index) => {
                    const tag = document.createElement("span");
                    tag.classList.add("rate-tag");
            
                    // First tag is green, second tag is red
                    if (index === 0) {
                        tag.classList.add("green-tag");
                    } else {
                        tag.classList.add("red-tag");
                    }
            
                    tag.textContent = tagText;
                    tagContainer.appendChild(tag);
                });
                name.appendChild(tagContainer);
            }

            // Append elements to the card
            card.appendChild(logo);
            card.appendChild(name);
            card.appendChild(anr);
            card.appendChild(mer);
            //anr.appendChild(tnaname);
            //mer.appendChild(temname);

            // Append card to the list
            ratesList.appendChild(card);
        });

    }

    categoryButtons.forEach(button => {
        button.addEventListener("click", function () {
            categoryButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            updateTable(this.getAttribute("data-category"));
        });
    });


    // 🔹 Add Event Listeners to Checkboxes for Dynamic Filtering
    includeNoClientCheckbox.addEventListener("change", () => updateTable(document.querySelector(".category-button.active").getAttribute("data-category")));
    noInterestLimitCheckbox.addEventListener("change", () => updateTable(document.querySelector(".category-button.active").getAttribute("data-category")));
    excludeDifferentialCheckbox.addEventListener("change", () => updateTable(document.querySelector(".category-button.active").getAttribute("data-category")));

    fetchRates();

    // Disclaimer Texts
    const disclaimers = {
        "todos": `El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversión pero no pretende en ningún caso asesorar o recomendar sobre las alternativas representadas. No es una recomendación de compra o inversión. No todas las opciones aquí representadas conllevan el mismo riesgo. Hacé tu propia investigación a la hora de invertir.<br><br>
    
        Los datos para los rendimientos de la sección de "Plazos Fijos" son informadas por el BCRA, pero pueden cambiar en cualquier momento. Los datos para los rendimientos de la sección de "Billeteras" son calculados a partir de fuentes propias y de las plataformas. Estos muestran el rendimiento que han tenido la última semana, pero esto no implica que tengan un rendimiento similar a futuro. Los datos para los rendimientos de la sección "Otros Activos" son calculados a partir de la información provista por la API de "Argentinadatos". Estos muestran la variación de precio que han tenido los distintos activos en los períodos de tiempo indicados, y cuánto rendimiento habrían generado. Estos activos pueden ser volátiles y conllevan riesgos significativos.<br><br>
    
        La información recolectada puede llegar a estar desactualizada y no garantizamos que estos sean los últimos rendimientos vigentes. Se recomienda consultar con cada entidad y llevar a cabo una investigación propia antes de hacer una inversión.`,

        "plazos_fijos": `El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversión pero no pretende en ningún caso asesorar o recomendar sobre las alternativas representadas. No es una recomendación de compra o inversión. No todas las opciones aquí representadas conllevan el mismo riesgo. Hacé tu propia investigación a la hora de invertir.<br><br>
    
        Los datos para los rendimientos de la sección de "Plazos Fijos" son informadas por el BCRA, pero pueden cambiar en cualquier momento. Se recomienda consultar con cada entidad antes de realizar una inversión.`,

        "billeteras": `El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversión pero no pretende en ningún caso asesorar o recomendar sobre las alternativas representadas. No es una recomendación de compra o inversión. No todas las opciones aquí representadas conllevan el mismo riesgo. Hacé tu propia investigación a la hora de invertir.<br><br>
    
        Los datos para los rendimientos de la sección de "Billeteras" son calculados a partir de fuentes propias y de las plataformas. Estos muestran el rendimiento que han tenido la última semana, pero esto no implica que tengan un rendimiento similar a futuro. Este rendimiento puede cambiar diariamente y no está garantizado. Se recomienda evaluar cada opción cuidadosamente antes de invertir.`,

        "otros_activos": `El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversión pero no pretende en ningún caso asesorar o recomendar sobre las alternativas representadas. No es una recomendación de compra o inversión. No todas las opciones aquí representadas conllevan el mismo riesgo. Hacé tu propia investigación a la hora de invertir.<br><br>
    
        Los datos para los rendimientos de la sección "Otros Activos" son calculados a partir de la información provista por la API de "Argentinadatos". Estos muestran la variación de precio que han tenido los distintos activos en los períodos de tiempo indicados, y cuánto rendimiento habrían generado. Estos activos pueden ser volátiles y conllevan riesgos significativos. No se garantiza que los rendimientos pasados se repitan en el futuro. Se recomienda llevar a cabo una investigación propia antes de llevar a cabo alguna acción.`,

        "fci_usd": `El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversión pero no pretende en ningún caso asesorar o recomendar sobre las alternativas representadas. No es una recomendación de compra o inversión. No todas las opciones aquí representadas conllevan el mismo riesgo. Hacé tu propia investigación a la hora de invertir.<br><br>
    
        Los datos para los rendimientos de la sección "FCI en Dólares" son calculados a partir de la información provista por la API de "Argentinadatos", sobre variaciones de precios en las cuotapartes de los Fondos Comunes de Inversión en Dólares en el último mes. Estos activos pueden ser volátiles y conllevan riesgos significativos. No se garantiza que los rendimientos pasados se repitan en el futuro. Se recomienda llevar a cabo una investigación propia antes de llevar a cabo alguna acción.`,
    };

    // Function to Update the Disclaimer Text
    function updateDisclaimer(selectedCategory) {
        const disclaimerText = document.getElementById("disclaimer-text");
        disclaimerText.innerHTML = disclaimers[selectedCategory] || disclaimers["todos"];
    }

    // Modify Category Button Event Listeners to Also Update Disclaimer
    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const selectedCategory = button.getAttribute("data-category");
            updateTable(selectedCategory);
            updateDisclaimer(selectedCategory); // Update the disclaimer
        });
    });

    // Load Default Disclaimer Initially
    updateDisclaimer("todos");


    
});