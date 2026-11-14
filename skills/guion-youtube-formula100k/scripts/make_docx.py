#!/usr/bin/env python3
"""
Genera un .docx tipo teleprompter para un guion de YouTube F100K.

Uso:
    python3 make_docx.py guion.json [salida.docx]

Esquema del JSON de entrada:
{
  "titulo": "Título del video",
  "subtitulo": "opcional",
  "salida": "ruta/opcional/GUION.docx",   # opcional, si no se pasa por argv
  "secciones": [
    {
      "titulo": "1. Romper patrón",
      "narracion": "Todo lo que dirá, palabra por palabra...",
      "cue": "En pantalla: antes y después lado a lado"
    }
  ]
}

Formato: sin tabla de contenido, cuerpo justificado, los "cue"
(señales de pantalla) en cajas con borde.

Requiere: pip install python-docx
"""
import sys, json
try:
    from docx import Document
except ImportError:
    print('Falta python-docx. Instálalo con: pip install python-docx')
    sys.exit(1)
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_cell_border(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '8')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), '111111')
        borders.append(el)
    tc_pr.append(borders)


def shade_cell(cell, fill='F2F2F2'):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)


def add_cue_box(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = True
    cell = table.cell(0, 0)
    set_cell_border(cell)
    shade_cell(cell, 'FFF7E6')  # crema suave
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run('🎬  ' + text)
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(0x7A, 0x5A, 0x00)
    run.italic = True
    doc.add_paragraph()


def main():
    if len(sys.argv) < 2:
        print('Uso: python3 make_docx.py guion.json [salida.docx]')
        sys.exit(1)

    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)

    salida = sys.argv[2] if len(sys.argv) > 2 else data.get('salida')
    if not salida:
        print('Falta la ruta de salida (argv[2] o "salida" en el JSON)')
        sys.exit(1)

    doc = Document()
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(12)

    # Título
    h = doc.add_paragraph()
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = h.add_run(data['titulo'])
    r.bold = True
    r.font.size = Pt(22)
    r.font.color.rgb = RGBColor(0x11, 0x11, 0x11)

    if data.get('subtitulo'):
        s = doc.add_paragraph()
        s.alignment = WD_ALIGN_PARAGRAPH.CENTER
        sr = s.add_run(data['subtitulo'])
        sr.italic = True
        sr.font.size = Pt(13)
        sr.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_paragraph()

    for sec in data['secciones']:
        hp = doc.add_paragraph()
        hr = hp.add_run(sec['titulo'])
        hr.bold = True
        hr.font.size = Pt(15)
        hr.font.color.rgb = RGBColor(0x11, 0x11, 0x11)

        if sec.get('cue'):
            add_cue_box(doc, sec['cue'])

        body = doc.add_paragraph(sec['narracion'])
        body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for run in body.runs:
            run.font.size = Pt(12)
        body.paragraph_format.space_after = Pt(14)
        body.paragraph_format.line_spacing = 1.3

    doc.save(salida)
    print('OK ->', salida)


if __name__ == '__main__':
    main()
