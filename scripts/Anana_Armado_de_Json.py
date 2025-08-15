# scripts/Anana_Armado_de_Json.py
# Generates data/Base.json and data/Inf_Mensual.json from INDEC APIs

import urllib.parse
import requests
import pandas as pd
import io
import os
import json

API_BASE_URL = "https://apis.datos.gob.ar/series/api/"

# ---- series id -> readable alias
SERIES = {
    "146.3_IALIMENUYO_DICI_M_41": "ipc_alimentos_bebidas_no_alcoholicas_cuyo",
    "146.3_IALIMENGBA_DICI_M_40": "ipc_alimentos_bebidas_no_alcoholicas_gba",
    "146.3_IALIMENNAL_DICI_M_45": "ipc_alimentos_bebidas_no_alcoholicas_nacional",
    "146.3_IALIMENNEA_DICI_M_40": "ipc_alimentos_bebidas_no_alcoholicas_nea",
    "146.3_IALIMENNOA_DICI_M_40": "ipc_alimentos_bebidas_no_alcoholicas_noa",
    "146.3_IALIMENANA_DICI_M_45": "ipc_alimentos_bebidas_no_alcoholicas_pampeana",
    "146.3_IALIMENNIA_DICI_M_46": "ipc_alimentos_bebidas_no_alcoholicas_patagonia",
    "146.3_IBEBIDAUYO_DICI_M_35": "ipc_bebidas_alcoholicas_tabaco_cuyo",
    "146.3_IBEBIDAGBA_DICI_M_34": "ipc_bebidas_alcoholicas_tabaco_gba",
    "146.3_IBEBIDANAL_DICI_M_39": "ipc_bebidas_alcoholicas_tabaco_nacional",
    "146.3_IBEBIDANEA_DICI_M_34": "ipc_bebidas_alcoholicas_tabaco_nea",
    "146.3_IBEBIDANOA_DICI_M_34": "ipc_bebidas_alcoholicas_tabaco_noa",
    "146.3_IBEBIDAANA_DICI_M_39": "ipc_bebidas_alcoholicas_tabaco_pampeana",
    "146.3_IBEBIDANIA_DICI_M_40": "ipc_bebidas_alcoholicas_tabaco_patagonia",
    "146.3_IBIENESUYO_DICI_M_32": "ipc_bienes_servicios_varios_cuyo",
    "146.3_IBIENESGBA_DICI_M_31": "ipc_bienes_servicios_varios_gba",
    "146.3_IBIENESNAL_DICI_M_36": "ipc_bienes_servicios_varios_nacional",
    "146.3_IBIENESNEA_DICI_M_31": "ipc_bienes_servicios_varios_nea",
    "146.3_IBIENESNOA_DICI_M_31": "ipc_bienes_servicios_varios_noa",
    "146.3_IBIENESANA_DICI_M_36": "ipc_bienes_servicios_varios_pampeana",
    "146.3_IBIENESNIA_DICI_M_37": "ipc_bienes_servicios_varios_patagonia",
    "146.3_ICOMUNIUYO_DICI_M_23": "ipc_comunicaciones_cuyo",
    "146.3_ICOMUNIGBA_DICI_M_22": "ipc_comunicaciones_gba",
    "146.3_ICOMUNINAL_DICI_M_27": "ipc_comunicaciones_nacional",
    "146.3_ICOMUNINEA_DICI_M_22": "ipc_comunicaciones_nea",
    "146.3_ICOMUNINOA_DICI_M_22": "ipc_comunicaciones_noa",
    "146.3_ICOMUNIANA_DICI_M_27": "ipc_comunicaciones_pampeana",
    "146.3_ICOMUNINIA_DICI_M_28": "ipc_comunicaciones_patagonia",
    "146.3_IEDUCACUYO_DICI_M_18": "ipc_educacion_cuyo",
    "146.3_IEDUCACGBA_DICI_M_17": "ipc_educacion_gba",
    "146.3_IEDUCACNAL_DICI_M_22": "ipc_educacion_nacional",
    "146.3_IEDUCACNEA_DICI_M_17": "ipc_educacion_nea",
    "146.3_IEDUCACNOA_DICI_M_17": "ipc_educacion_noa",
    "146.3_IEDUCACANA_DICI_M_22": "ipc_educacion_pampeana",
    "146.3_IEDUCACNIA_DICI_M_23": "ipc_educacion_patagonia",
    "146.3_IEQUIPAUYO_DICI_M_42": "ipc_equipamiento_mantenimientos_hogar_cuyo",
    "146.3_IEQUIPAGBA_DICI_M_41": "ipc_equipamiento_mantenimientos_hogar_gba",
    "146.3_IEQUIPANAL_DICI_M_46": "ipc_equipamiento_mantenimientos_hogar_nacional",
    "146.3_IEQUIPANEA_DICI_M_41": "ipc_equipamiento_mantenimientos_hogar_nea",
    "146.3_IEQUIPANOA_DICI_M_41": "ipc_equipamiento_mantenimientos_hogar_noa",
    "146.3_IEQUIPAANA_DICI_M_46": "ipc_equipamiento_mantenimientos_hogar_pampeana",
    "146.3_IEQUIPANIA_DICI_M_47": "ipc_equipamiento_mantenimientos_hogar_patagonia",
    # tasas (if you later want to use them)
    "145.3_INGCUYUAL_DICI_M_34": "ipc_ng_cuyo_tasa_variacion_mensual",
    "145.3_INGGBAUAL_DICI_M_33": "ipc_ng_gba_tasa_variacion_mensual",
    "145.3_INGNACUAL_DICI_M_38": "ipc_ng_nacional_tasa_variacion_mensual",
    "145.3_INGNEAUAL_DICI_M_33": "ipc_ng_nea_tasa_variacion_mensual",
    "145.3_INGNOAUAL_DICI_M_33": "ipc_ng_noa_tasa_variacion_mensual",
    "145.3_INGPAMUAL_DICI_M_38": "ipc_ng_pampeana_tasa_variacion_mensual",
    "145.3_INGPATUAL_DICI_M_39": "ipc_ng_patagonia_tasa_variacion_mensual",
    # indices nivel general (for Base + pct_change for Inf_Mensual)
    "148.3_INIVELUYO_DICI_M_22": "ipc_nivel_general_cuyo",
    "148.3_INIVELGBA_DICI_M_21": "ipc_nivel_general_gba",
    "148.3_INIVELNAL_DICI_M_26": "ipc_nivel_general_nacional",
    "148.3_INIVELNEA_DICI_M_21": "ipc_nivel_general_nea",
    "148.3_INIVELNOA_DICI_M_21": "ipc_nivel_general_noa",
    "148.3_INIVELANA_DICI_M_26": "ipc_nivel_general_pampeana",
    "148.3_INIVELNIA_DICI_M_27": "ipc_nivel_general_patagonia",
    "146.3_IPRENDAUYO_DICI_M_31": "ipc_prendas_vestir_calzado_cuyo",
    "146.3_IPRENDAGBA_DICI_M_30": "ipc_prendas_vestir_calzado_gba",
    "146.3_IPRENDANAL_DICI_M_35": "ipc_prendas_vestir_calzado_nacional",
    "146.3_IPRENDANEA_DICI_M_30": "ipc_prendas_vestir_calzado_nea",
    "146.3_IPRENDANOA_DICI_M_30": "ipc_prendas_vestir_calzado_noa",
    "146.3_IPRENDAANA_DICI_M_35": "ipc_prendas_vestir_calzado_pampeana",
    "146.3_IPRENDANIA_DICI_M_36": "ipc_prendas_vestir_calzado_patagonia",
    "146.3_IRECREAUYO_DICI_M_27": "ipc_recreacion_cultura_cuyo",
    "146.3_IRECREAGBA_DICI_M_26": "ipc_recreacion_cultura_gba",
    "146.3_IRECREANAL_DICI_M_31": "ipc_recreacion_cultura_nacional",
    "146.3_IRECREANEA_DICI_M_26": "ipc_recreacion_cultura_nea",
    "146.3_IRECREANOA_DICI_M_26": "ipc_recreacion_cultura_noa",
    "146.3_IRECREAANA_DICI_M_31": "ipc_recreacion_cultura_pampeana",
    "146.3_IRECREANIA_DICI_M_32": "ipc_recreacion_cultura_patagonia",
    "146.3_IRESTAUUYO_DICI_M_29": "ipc_restaurantes_hoteles_cuyo",
    "146.3_IRESTAUGBA_DICI_M_28": "ipc_restaurantes_hoteles_gba",
    "146.3_IRESTAUNAL_DICI_M_33": "ipc_restaurantes_hoteles_nacional",
    "146.3_IRESTAUNEA_DICI_M_28": "ipc_restaurantes_hoteles_nea",
    "146.3_IRESTAUNOA_DICI_M_28": "ipc_restaurantes_hoteles_noa",
    "146.3_IRESTAUANA_DICI_M_33": "ipc_restaurantes_hoteles_pampeana",
    "146.3_IRESTAUNIA_DICI_M_34": "ipc_restaurantes_hoteles_patagonia",
    "146.3_ISALUDUYO_DICI_M_14": "ipc_salud_cuyo",
    "146.3_ISALUDGBA_DICI_M_13": "ipc_salud_gba",
    "146.3_ISALUDNAL_DICI_M_18": "ipc_salud_nacional",
    "146.3_ISALUDNEA_DICI_M_13": "ipc_salud_nea",
    "146.3_ISALUDNOA_DICI_M_13": "ipc_salud_noa",
    "146.3_ISALUDANA_DICI_M_18": "ipc_salud_pampeana",
    "146.3_ISALUDNIA_DICI_M_19": "ipc_salud_patagonia",
    "146.3_ITRANSPUYO_DICI_M_19": "ipc_transporte_cuyo",
    "146.3_ITRANSPGBA_DICI_M_18": "ipc_transporte_gba",
    "146.3_ITRANSPNAL_DICI_M_23": "ipc_transporte_nacional",
    "146.3_ITRANSPNEA_DICI_M_18": "ipc_transporte_nea",
    "146.3_ITRANSPNOA_DICI_M_18": "ipc_transporte_noa",
    "146.3_ITRANSPANA_DICI_M_23": "ipc_transporte_pampeana",
    "146.3_ITRANSPNIA_DICI_M_24": "ipc_transporte_patagonia",
    "146.3_IVIVIENUYO_DICI_M_48": "ipc_vivienda_agua_electricidad_combustibles_cuyo",
    "146.3_IVIVIENGBA_DICI_M_47": "ipc_vivienda_agua_electricidad_combustibles_gba",
    "146.3_IVIVIENNAL_DICI_M_52": "ipc_vivienda_agua_electricidad_combustibles_nacional",
    "146.3_IVIVIENNEA_DICI_M_47": "ipc_vivienda_agua_electricidad_combustibles_nea",
    "146.3_IVIVIENNOA_DICI_M_47": "ipc_vivienda_agua_electricidad_combustibles_noa",
    "146.3_IVIVIENANA_DICI_M_52": "ipc_vivienda_agua_electricidad_combustibles_pampeana",
    "146.3_IVIVIENNIA_DICI_M_53": "ipc_vivienda_agua_electricidad_combustibles_patagonia",
}

REGION_MAP = {
    "nacional": "Nacional",
    "gba": "GBA",
    "pampeana": "Pampeana",
    "nea": "NEA",
    "noa": "NOA",
    "cuyo": "Cuyo",
    "patagonia": "Patagonia",
}

MONTHS_ES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

CATEGORIES_MAP = {
    "alimentos_bebidas_no_alcoholicas": "Alimentos_y_bebidas_no_alcoholicas",
    "bebidas_alcoholicas_tabaco": "Bebidas_alcoholicas_y_tabaco",
    "bienes_servicios_varios": "Bienes_y_servicios_varios",
    "comunicaciones": "Comunicacion",
    "comunicacion": "Comunicacion",
    "educacion": "Educacion",
    "equipamiento_mantenimientos_hogar": "Equipamiento_y_mantenimiento_del_hogar",
    "equipamiento_mantenimiento_del_hogar": "Equipamiento_y_mantenimiento_del_hogar",
    "nivel_general": "Nivel_general",
    "prendas_vestir_calzado": "Prendas_de_vestir_y_calzado",
    "recreacion_cultura": "Recreacion_y_cultura",
    "restaurantes_hoteles": "Restaurantes_y_hoteles",
    "salud": "Salud",
    "transporte": "Transporte",
    "vivienda_agua_electricidad_combustibles": "Vivienda,_agua,_electricidad,_gas_y_otros_combustibles",
}

def normalize_category(cat_raw: str) -> str:
    return CATEGORIES_MAP.get(cat_raw.lower(), cat_raw)

def api_csv(ids, start_date=2020):
    """Download CSV for several series (chunked) and merge by date."""
    ids = list(ids)
    chunks = [ids[i:i+15] for i in range(0, len(ids), 15)]
    dfs = []
    for ch in chunks:
        params = {"ids": ",".join(ch), "format": "csv", "start_date": start_date}
        url = f"{API_BASE_URL}series?{urllib.parse.urlencode(params)}"
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        df = pd.read_csv(io.BytesIO(r.content))
        date_col = [c for c in df.columns if c.lower().startswith("indice_tiempo") or c.lower() == "time"][0]
        df.rename(columns={date_col: "date"}, inplace=True)
        df["date"] = pd.to_datetime(df["date"])
        dfs.append(df)
    out = dfs[0]
    for df in dfs[1:]:
        out = out.merge(df, on="date", how="outer")
    return out.sort_values("date").reset_index(drop=True)

def parse_region_and_category(alias: str):
    # alias: e.g., "ipc_alimentos_bebidas_no_alcoholicas_cuyo"
    tokens = alias.split("_")
    maybe_region = tokens[-1].lower()
    region = REGION_MAP.get(maybe_region, None)
    if region:
        cat_tokens = tokens[1:-1]  # remove "ipc" and region
    else:
        if "tasa" in tokens:
            i = tokens.index("tasa")
            maybe_region = tokens[i-1].lower()
            region = REGION_MAP.get(maybe_region, None)
            cat_tokens = tokens[1:i-1]
        else:
            region = "Nacional"
            cat_tokens = tokens[1:]
    categoria = "_".join(cat_tokens)
    return region, categoria

def month_key(dt):
    return f"{dt.year:04d}_{dt.month:02d}"

def month_label(dt):
    return f"{MONTHS_ES[dt.month-1]} '{str(dt.year)[-2:]}"

def is_index_series(series_id: str, alias: str):
    # Simple heuristic: indices start with 146.3_I... or alias contains nivel_general
    return series_id.startswith("146.3_I") or "nivel_general" in alias

def main():
    os.makedirs("data", exist_ok=True)

    # 1) Download everything
    ids = list(SERIES.keys())
    df = api_csv(ids, start_date=2020)

    # rename columns to human aliases
    rename_map = {sid: alias for sid, alias in SERIES.items() if sid in df.columns}
    df.rename(columns=rename_map, inplace=True)

    # 2) Base.json: for each (Region, Categoria) index -> wide YYYY_MM
    base_rows = []
    for sid, alias in SERIES.items():
        if alias not in df.columns:
            continue
        if not is_index_series(sid, alias):
            continue

        region, categoria = parse_region_and_category(alias)
        categoria = normalize_category(categoria)
        row = {
            "Ordenamiento": 1,
            "Region": region,
            "Categoria": categoria,
            "Cat_Level": 1
        }
        for _, r in df[["date", alias]].dropna().iterrows():
            row[month_key(r["date"])] = float(r[alias])
        base_rows.append(row)

    with open("data/Base.json", "w", encoding="utf-8") as f:
        json.dump(base_rows, f, ensure_ascii=False, indent=4)

    # 3) Inf_Mensual.json: m/m from index series
    inf_rows = []
    for sid, alias in SERIES.items():
        if alias not in df.columns:
            continue
        if not is_index_series(sid, alias):
            continue

        region, categoria = parse_region_and_category(alias)
        categoria = normalize_category(categoria)
        s = df[["date", alias]].dropna().sort_values("date").reset_index(drop=True)
        s["pct_m"] = s[alias].pct_change()

        row = {
            "Ordenamiento": 1,
            "Region": region,
            "Categoria": categoria
        }
        for _, r in s.iloc[1:].iterrows():  # skip first NaN
            row[month_label(r["date"])] = float(r["pct_m"])
        inf_rows.append(row)

    with open("data/Inf_Mensual.json", "w", encoding="utf-8") as f:
        json.dump(inf_rows, f, ensure_ascii=False, indent=4)

    print("✓ data/Base.json y data/Inf_Mensual.json actualizados.")

if __name__ == "__main__":
    main()
