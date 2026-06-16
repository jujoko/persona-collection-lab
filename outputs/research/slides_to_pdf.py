from pathlib import Path

from pypdf import PdfReader
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas


preview_dir = Path("outputs/research/qa/deck_render")
out_pdf = Path("outputs/research/persona_research_presentation_ko.pdf")
slide_paths = sorted(preview_dir.glob("slide-*.png"))
if not slide_paths:
    raise SystemExit("No slide PNGs found")

page_size = landscape(letter)
c = canvas.Canvas(str(out_pdf), pagesize=page_size)
page_w, page_h = page_size
for path in slide_paths:
    c.drawImage(str(path), 0, 0, width=page_w, height=page_h, preserveAspectRatio=True, anchor="c")
    c.showPage()
c.save()
reader = PdfReader(str(out_pdf))
print(f"{out_pdf} pages={len(reader.pages)}")
