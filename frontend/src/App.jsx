import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)
  // Yeni State: Çeviri yapılsın mı?
  const [translateTr, setTranslateTr] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setMessage('')
    setSubtitleUrl(null)

    if (selectedFile) {
      setVideoUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Lütfen önce bir video seçin.')
      return
    }

    setLoading(true)
    setMessage(translateTr
      ? 'Video işleniyor ve Türkçeye çevriliyor, lütfen bekleyin...'
      : 'Video işleniyor, lütfen bekleyin...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('translate_to_tr', translateTr) // Python'a çeviri kararını gönderiyoruz

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-video/', formData, {
        responseType: 'blob',
      })

      const vttBlob = new Blob([response.data], { type: 'text/vtt' })
      const vttUrl = URL.createObjectURL(vttBlob)
      setSubtitleUrl(vttUrl)

      setMessage('İşlem başarılı! Videoyu altyazılı olarak izleyebilirsiniz.')
    } catch (error) {
      console.error(error)
      setMessage('Bir hata oluştu. Backend sunucusunun çalıştığından emin olun.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Otomatik Altyazı Oluşturucu</h1>
      <p>İngilizce videonuzu yükleyin, anında altyazılı izleyin.</p>

      <div className="upload-box">
        <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />

        {/* Çeviri Seçeneği Kutucuğu */}
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="translateToggle"
            checked={translateTr}
            onChange={(e) => setTranslateTr(e.target.checked)}
          />
          <label htmlFor="translateToggle">İngilizce altyazıyı doğrudan Türkçe'ye çevir</label>
        </div>

        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'İşleniyor...' : 'Altyazı Çıkar'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {videoUrl && (
        <div className="video-player-box">
          <video controls width="100%" key={subtitleUrl}>
            <source src={videoUrl} type={file?.type || 'video/mp4'} />
            {subtitleUrl && (
              <track
                kind="subtitles"
                src={subtitleUrl}
                srcLang={translateTr ? "tr" : "en"}
                label={translateTr ? "Türkçe" : "English"}
                default
              />
            )}
            Tarayıcınız video etiketini desteklemiyor.
          </video>

          {subtitleUrl && (
            <a href={subtitleUrl} download="altyazi.vtt" className="download-btn">
              Altyazıyı Bilgisayara İndir (.vtt)
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default App