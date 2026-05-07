from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import time
import os

app = FastAPI(title="Auto Subtitle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_time_vtt(seconds):
    """Saniyeyi standart WebVTT formatına (HH:MM:SS.mmm) dönüştürür."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds_int = int(seconds % 60)
    milliseconds = int((seconds - int(seconds)) * 1000)
    # SRT'den farklı olarak virgül yerine NOKTA kullanıyoruz
    return f"{hours:02}:{minutes:02}:{seconds_int:02}.{milliseconds:03}"


def generate_subtitles(video_path, output_filename="altyazi.vtt"):
    model_size = "small"
    print(f"[{model_size}] modeli CPU üzerine yükleniyor...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(video_path, beam_size=5)

    with open(output_filename, "w", encoding="utf-8") as vtt_file:
        # VTT dosyasının zorunlu başlığı
        vtt_file.write("WEBVTT\n\n")

        for index, segment in enumerate(segments, start=1):
            vtt_file.write(f"{index}\n")
            vtt_file.write(f"{format_time_vtt(segment.start)} --> {format_time_vtt(segment.end)}\n")
            vtt_file.write(f"{segment.text.strip()}\n\n")


@app.post("/upload-video/")
async def process_video(file: UploadFile = File(...)):
    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())

    output_vtt = "altyazi.vtt"
    generate_subtitles(temp_video_path, output_vtt)

    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)

    # React'e SRT yerine VTT dosyası gönderiyoruz
    return FileResponse(path=output_vtt, media_type='text/vtt', filename=output_vtt)