from pathlib import Path
import pypdfium2 as pdfium

pdf_path = Path(r"C:\Users\dell\Desktop\NEW APP\test-artifacts\End to End Testing.pdf")
output_dir = pdf_path.parent / "rendered-report"
output_dir.mkdir(parents=True, exist_ok=True)
document = pdfium.PdfDocument(pdf_path)
for index in range(len(document)):
    page = document[index]
    bitmap = page.render(scale=1.5)
    bitmap.to_pil().save(output_dir / f"page-{index + 1:02d}.png")
print(f"Rendered {len(document)} pages")
