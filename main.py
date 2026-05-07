from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from deep_translator import GoogleTranslator
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
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds_int = int(seconds % 60)
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02}.{milliseconds:03}"


def generate_subtitles(video_path, output_filename="altyazi.vtt", translate=False):
    model_size = "small"
    print(f"[{model_size}] modeli CPU üzerine yükleniyor...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(video_path, beam_size=5)

    # Çeviri seçeneği işaretlendiyse çevirmen nesnesini hazırla
    translator = GoogleTranslator(source='auto', target='tr') if translate else None

    with open(output_filename, "w", encoding="utf-8") as vtt_file:
        vtt_file.write("WEBVTT\n\n")

        for index, segment in enumerate(segments, start=1):
            text = segment.text.strip()

            # Eğer kullanıcı çeviri istediyse, metni anında Türkçeye çeviriyoruz
            if translate and text:
                try:
                    text = translator.translate(text)
                except Exception as e:
                    print(f"Çeviri hatası: {e}")

            vtt_file.write(f"{index}\n")
            vtt_file.write(f"{format_time_vtt(segment.start)} --> {format_time_vtt(segment.end)}\n")
            vtt_file.write(f"{text}\n\n")


# Frontend'den gelen 'translate_to_tr' (çeviri yapılsın mı?) değerini yakalıyoruz
@app.post("/upload-video/")
async def process_video(
        file: UploadFile = File(...),
        translate_to_tr: str = Form("false")
):
    # Gelen string değeri boolean'a (True/False) dönüştür
    is_translation_requested = (translate_to_tr.lower() == "true")

    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())

    output_vtt = "altyazi.vtt"
    # Çeviri kararını fonksiyona iletiyoruz
    generate_subtitles(temp_video_path, output_vtt, translate=is_translation_requested)

    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)

    return FileResponse(path=output_vtt, media_type='text/vtt', filename=output_vtt)