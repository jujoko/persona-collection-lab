from pathlib import Path
from pdf2image import convert_from_path

out = Path("outputs/research/qa/paper_pdf_pages")
out.mkdir(parents=True, exist_ok=True)
pages = convert_from_path(
    "outputs/research/persona_simulation_research_paper_ko.pdf",
    dpi=120,
)
for i, page in enumerate(pages, 1):
    page.save(out / f"page-{i:02d}.png")
print(f"rendered {len(pages)}")
