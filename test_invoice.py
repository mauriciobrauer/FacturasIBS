from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

# Crear un PDF simple con una factura de prueba
def create_test_invoice():
    filename = "test_factura.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Título
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 100, "FACTURA MÉDICA")
    
    # Información de la factura
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 150, "Fecha: 26/10/2023")
    c.drawString(100, height - 180, "Proveedor: Clínica San José")
    c.drawString(100, height - 210, "Descripción: Consulta médica general")
    c.drawString(100, height - 240, "Monto: 75.50 €")
    
    # Pie de página
    c.setFont("Helvetica", 10)
    c.drawString(100, 100, "Esta es una factura de prueba para testing")
    
    c.save()
    print(f"✅ PDF de prueba creado: {filename}")
    return filename

if __name__ == "__main__":
    create_test_invoice()
