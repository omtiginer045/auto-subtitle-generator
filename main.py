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


def get_subtitles_data(video_path, translate=False):
    model_size = "small"
    print(f"[{model_size}] modeli CPU üzerine yükleniyor...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(video_path, beam_size=5)
    translator = GoogleTranslator(source='auto', target='tr') if translate else None

    subtitles = []
    for index, segment in enumerate(segments, start=1):
        text = segment.text.strip()
        if translate and text:
            try:
                text = translator.translate(text)
            except Exception as e:
                print(f"Çeviri hatası: {e}")

        # Verileri yapılandırılmış sözlük (dictionary) formatına sokuyoruz
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
        translate_to_tr: str = Form("false")
):
    is_translation_requested = (translate_to_tr.lower() == "true")

    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())

    # SRT/VTT dosyası kaydetmek yerine, veriyi doğrudan RAM'de JSON'a çeviriyoruz
    subtitles_data = get_subtitles_data(temp_video_path, translate=is_translation_requested)

    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)

    # React tarafına JSON verisi gönderiyoruz
    return JSONResponse(content={"subtitles": subtitles_data})