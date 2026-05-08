# Temel Python imajını kullan
FROM python:3.10-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Whisper için gerekli olan ffmpeg aracını işletim sistemine kur
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Gereksinim dosyasını kopyala ve kütüphaneleri kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm backend kodlarını kopyala
COPY . .

# FastAPI'nin çalışacağı portu dışarı aç
EXPOSE 8000

# Sunucuyu başlat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]