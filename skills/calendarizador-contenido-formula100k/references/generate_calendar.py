#!/usr/bin/env python3
"""
Genera CSV y XLSX para un calendario de contenido FÓRMULA 100K.

Uso:
  python3 generate_calendar.py --modo crecimiento --output-dir /path/ --data-json '{...}'

Input JSON:
  {
    "modo": "crecimiento",
    "fecha_inicio": "2026-05-04",
    "filas": [
      {"dia":"Lunes","idea":"...","guion":"...","cta":"...","formato":"Pizarra (#19)","referencia":"Original"},
      ...
    ]
  }

Output:
  - calendario_<modo>_<fecha_inicio>.csv  (UTF-8 BOM para Excel Mac/Windows)
  - calendario_<modo>_<fecha_inicio>.xlsx (openpyxl)
"""

import argparse
import csv
import json
import os
import sys
from pathlib import Path

COLUMNS = ["DÍA", "IDEA", "GUION", "LLAMADO A LA ACCIÓN", "FORMATO", "REFERENCIA"]


def write_csv(path: Path, filas: list[dict]) -> None:
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(COLUMNS)
        for row in filas:
            writer.writerow([
                row.get("dia", ""),
                row.get("idea", ""),
                row.get("guion", ""),
                row.get("cta", ""),
                row.get("formato", ""),
                row.get("referencia", "Original"),
            ])


def write_xlsx(path: Path, filas: list[dict], modo: str) -> bool:
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
        from openpyxl.utils import get_column_letter
    except ImportError:
        return False

    wb = Workbook()
    ws = wb.active
    ws.title = f"Calendario {modo[:25]}"

    header_fill = PatternFill("solid", fgColor="44403C")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    cell_align = Alignment(wrap_text=True, vertical="top")
    thin = Side(border_style="thin", color="D6D3D1")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for col_idx, col_name in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border

    type_colors = {
        "Viral": "FEE2E2",
        "Valor": "FEF3C7",
        "Venta": "D1FAE5",
    }

    for row_idx, row in enumerate(filas, start=2):
        values = [
            row.get("dia", ""),
            row.get("idea", ""),
            row.get("guion", ""),
            row.get("cta", ""),
            row.get("formato", ""),
            row.get("referencia", "Original"),
        ]
        tipo = row.get("tipo", "")
        fill = PatternFill("solid", fgColor=type_colors.get(tipo, "FFFFFF")) if tipo in type_colors else None
        for col_idx, value in enumerate(values, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.alignment = cell_align
            cell.border = border
            if fill and col_idx == 1:
                cell.fill = fill
                cell.font = Font(bold=True)

    widths = [12, 28, 70, 32, 24, 38]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w

    for row_idx in range(2, len(filas) + 2):
        ws.row_dimensions[row_idx].height = 90

    ws.freeze_panes = "A2"

    wb.save(path)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--modo", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--data-json", required=False)
    parser.add_argument("--data-file", required=False)
    args = parser.parse_args()

    if args.data_file:
        with open(args.data_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    elif args.data_json:
        data = json.loads(args.data_json)
    else:
        data = json.load(sys.stdin)

    modo = data.get("modo", args.modo)
    fecha = data.get("fecha_inicio", "")
    filas = data.get("filas", [])

    if not filas:
        print("ERROR: No filas to write.", file=sys.stderr)
        return 1

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    base = f"calendario_{modo}_{fecha}" if fecha else f"calendario_{modo}"
    csv_path = out_dir / f"{base}.csv"
    xlsx_path = out_dir / f"{base}.xlsx"

    write_csv(csv_path, filas)
    xlsx_ok = write_xlsx(xlsx_path, filas, modo)

    result = {
        "csv": str(csv_path),
        "xlsx": str(xlsx_path) if xlsx_ok else None,
        "xlsx_error": None if xlsx_ok else "openpyxl no instalado. Instala con: pip3 install openpyxl",
        "rows": len(filas),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
