from faster_whisper import WhisperModel
import time


def generate_subtitles(video_path):
    # Model boyutu. İşlemci (CPU) testleri için "base" veya "small" idealdir.
    model_size = "small"

    print(f"[{model_size}] modeli CPU üzerine yükleniyor, lütfen bekleyin...")

    # Cihazı "cpu" olarak seçip int8 ile RAM optimizasyonu yapıyoruz
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print("Model yüklendi. Video işleniyor...")
    print("(Not: İşlemci (CPU) kullanıldığı için bu aşama GPU'ya göre biraz daha uzun sürebilir)")
    start_time = time.time()

    # Videoyu modele veriyoruz.
    segments, info = model.transcribe(video_path, beam_size=5)

    print(f"Algılanan dil: {info.language} (Olasılık: %{info.language_probability * 100:.2f})")
    print("-" * 50)

    # Çıktıları zaman damgalarıyla birlikte ekrana yazdırıyoruz
    for segment in segments:
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")

    end_time = time.time()
    print("-" * 50)
    print(f"İşlem tamamlandı! Toplam süre: {end_time - start_time:.2f} saniye")


if __name__ == "__main__":
    # Test etmek istediğin videonun yolunu buraya yaz
    video_dosyasi = "test_video.mp4"
    generate_subtitles(video_dosyasi)