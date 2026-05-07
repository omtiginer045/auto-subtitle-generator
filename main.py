from faster_whisper import WhisperModel
import time


def format_time(seconds):
    """Saniyeyi standart SRT zaman formatına (HH:MM:SS,mmm) dönüştürür."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds_int = int(seconds % 60)
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02},{milliseconds:03}"


def generate_subtitles(video_path, output_filename="altyazi.srt"):
    # Hala işlemci (CPU) üzerinden devam ediyoruz
    model_size = "small"

    print(f"[{model_size}] modeli CPU üzerine yükleniyor, lütfen bekleyin...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print("Model yüklendi. Video işleniyor...")
    start_time = time.time()

    segments, info = model.transcribe(video_path, beam_size=5)

    print(f"Algılanan dil: {info.language} (Olasılık: %{info.language_probability * 100:.2f})")
    print("-" * 50)

    # SRT dosyasını oluşturma ve yazma aşaması
    with open(output_filename, "w", encoding="utf-8") as srt_file:
        for index, segment in enumerate(segments, start=1):
            # Zaman damgalarını SRT formatına çevir
            start_time_str = format_time(segment.start)
            end_time_str = format_time(segment.end)

            # 1. Altyazı Sıra Numarasını Yazdır
            srt_file.write(f"{index}\n")

            # 2. Zaman Aralığını Yazdır
            srt_file.write(f"{start_time_str} --> {end_time_str}\n")

            # 3. Altyazı Metnini Yazdır
            srt_file.write(f"{segment.text.strip()}\n\n")

            # İşlemi takip edebilmek için terminale de yansıt
            print(f"Yazılıyor: [{start_time_str} -> {end_time_str}]")

    end_time = time.time()
    print("-" * 50)
    print(f"İşlem tamamlandı! '{output_filename}' dosyası proje klasörüne oluşturuldu.")
    print(f"Toplam süre: {end_time - start_time:.2f} saniye")


if __name__ == "__main__":
    video_dosyasi = "test_video.mp4"
    generate_subtitles(video_dosyasi)