FROM python:3.11-slim

WORKDIR /app

# Install FastAPI + your RAG deps
# src/ is mounted at runtime so we only need the libraries here
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the API entrypoint — RAG src/ is mounted via docker-compose volume
COPY api.py .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

