import os
import sys

# Architectural Note: Because this script resides in a subdirectory, we must 
# explicitly add the project root to the Python path to import the 'src' package.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import PDFInsightsEngine

def run_batch_ingestion(data_dir: str = "/app/data"):
    """
    Scans the data directory and ingests all found PDF files.
    """
    engine = PDFInsightsEngine()
    
    # 1. Verification: Ensure the directory exists
    if not os.path.exists(data_dir):
        print(f"Error: The directory {data_dir} was not found. Ensure it is mapped in docker-compose.")
        return

    # 2. Scanning: Find all PDF files
    pdf_files = [f for f in os.listdir(data_dir) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print(f"No PDF files found in {data_dir}. Please add documents to your data folder.")
        return

    print(f"--- Found {len(pdf_files)} PDFs. Initiating ingestion pipeline... ---")

    # 3. Processing: Batch loop
    for file in pdf_files:
        full_path = os.path.join(data_dir, file)
        try:
            print(f"Processing document: {file}")
            engine.ingest_pdf(full_path)
            print(f"Successfully ingested: {file}")
        except Exception as e:
            print(f"Critical Error processing {file}: {e}")

    print("--- Ingestion complete. Vector Store is updated. ---")

if __name__ == "__main__":
    run_batch_ingestion()
