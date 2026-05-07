from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import time
import os

# FastAPI uygulamasını başlatıyoruz
app = FastAPI(title="Auto Subtitle API")

# İleride React'in (farklı bir portta çalışacağı için) bu API'ye erişebilmesi için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme aşamasında her yere açık
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds_int = int(seconds % 60)
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02},{milliseconds:03}"


def generate_subtitles(video_path, output_filename="altyazi.srt"):
    model_size = "small"
    print(f"[{model_size}] modeli CPU üzerine yükleniyor...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(video_path, beam_size=5)

    with open(output_filename, "w", encoding="utf-8") as srt_file:
        for index, segment in enumerate(segments, start=1):
            srt_file.write(f"{index}\n")
            srt_file.write(f"{format_time(segment.start)} --> {format_time(segment.end)}\n")
            srt_file.write(f"{segment.text.strip()}\n\n")


# --- YENİ API UÇ NOKTASI (ENDPOINT) ---
@app.post("/upload-video/")
async def process_video(file: UploadFile = File(...)):
    # React'ten gelen videoyu geçici olarak kaydet
    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())

    output_srt = "altyazi.srt"

    # Kaydedilen videoyu Whisper'a gönder
    generate_subtitles(temp_video_path, output_srt)

    # İşlem bitince videoyu temizle (yer kaplamaması için)
    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)

    # Oluşan SRT dosyasını kullanıcıya (React'e) geri döndür
    return FileResponse(path=output_srt, media_type='application/x-subrip', filename=output_srt)