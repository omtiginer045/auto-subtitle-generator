from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
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


# translate(boolean) yerine target_language(string) alıyoruz
def get_subtitles_data(video_path, target_language="none"):
    model_size = "small"
    print(f"[{model_size}] modeli CPU üzerine yükleniyor...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(video_path, beam_size=5)

    # Kullanıcı "none" (hiçbiri) dışında bir dil seçtiyse çevirmeni o dille başlat
    translator = GoogleTranslator(source='auto', target=target_language) if target_language != "none" else None

    subtitles = []
    for index, segment in enumerate(segments, start=1):
        text = segment.text.strip()

        # Çevirmen aktifse metni çevir
        if translator and text:
            try:
                text = translator.translate(text)
            except Exception as e:
                print(f"Çeviri hatası: {e}")

        subtitles.append({
            "id": index,
            "start": segment.start,
            "end": segment.end,
            "start_vtt": format_time_vtt(segment.start),
            "end_vtt": format_time_vtt(segment.end),
            "text": text
        })
    return subtitles


@app.post("/upload-video/")
async def process_video(
        file: UploadFile = File(...),
        target_language: str = Form("none")  # React'ten gelecek yeni parametre
):
    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())

    # Seçilen dili fonksiyona iletiyoruz
    subtitles_data = get_subtitles_data(temp_video_path, target_language=target_language)

    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)

    return JSONResponse(content={"subtitles": subtitles_data})