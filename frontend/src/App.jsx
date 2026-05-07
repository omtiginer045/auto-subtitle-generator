import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setMessage('')
    setSubtitleUrl(null) // Yeni video seçildiğinde eski altyazıyı temizle

    // Videoyu tarayıcıda izleyebilmek için geçici bir link oluştur
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
    setMessage('Video işleniyor, bu işlem videonun uzunluğuna göre biraz sürebilir...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-video/', formData, {
        responseType: 'blob', // Backend'den dosya beklediğimizi belirtiyoruz
      })

      // Gelen VTT dosyasını tarayıcıda okunabilir bir URL'ye çeviriyoruz
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
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'İşleniyor...' : 'Altyazı Çıkar'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {/* Video seçildiği an bu oynatıcı görünür olur */}
      {videoUrl && (
        <div className="video-player-box">
          {/* key değeri subtitleUrl değiştiğinde oynatıcının güncellenmesini zorlar */}
          <video controls width="100%" key={subtitleUrl}>
            <source src={videoUrl} type={file?.type || 'video/mp4'} />

            {/* Altyazı hazır olduğunda track etiketi devreye girer */}
            {subtitleUrl && (
              <track
                kind="subtitles"
                src={subtitleUrl}
                srcLang="en"
                label="English"
                default
              />
            )}
            Tarayıcınız video etiketini desteklemiyor.
          </video>

          {/* İsteğe bağlı indirme butonu */}
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