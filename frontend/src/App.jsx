import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)

  // Yeni: Seçilen dili tutacak state (varsayılan: none)
  const [targetLanguage, setTargetLanguage] = useState('none')

  const [subtitles, setSubtitles] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setVideoUrl(selectedFile ? URL.createObjectURL(selectedFile) : null)
    setSubtitles([])
    setSubtitleUrl(null)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  useEffect(() => {
    if (subtitles.length > 0) {
      let vttContent = "WEBVTT\n\n"
      subtitles.forEach(sub => {
        vttContent += `${sub.id}\n${sub.start_vtt} --> ${sub.end_vtt}\n${sub.text}\n\n`
      })
      setSubtitleUrl(URL.createObjectURL(new Blob([vttContent], { type: 'text/vtt' })))
    }
  }, [subtitles])

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true)
    setMessage(targetLanguage === 'none' ? 'Video işleniyor...' : 'Video işleniyor ve çevriliyor...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('target_language', targetLanguage) // Backend'e seçilen dili gönderiyoruz

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-video/', formData)
      setSubtitles(response.data.subtitles)
      setMessage('İşlem başarılı! Konuşulan satır sağda parlayacaktır.')
    } catch (error) {
      console.error(error)
      setMessage('Bir hata oluştu. Sunucu bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const handleTextChange = (id, newText) => {
    setSubtitles(subs => subs.map(s => s.id === id ? { ...s, text: newText } : s))
  }

  const handleSeek = (startTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime
      videoRef.current.play()
    }
  }

  // Altyazı etiketi için yardımcı fonksiyon
  const getLanguageLabel = () => {
    const labels = { tr: 'Türkçe', de: 'Almanca', es: 'İspanyolca', fr: 'Fransızca', ja: 'Japonca' };
    return labels[targetLanguage] || 'English';
  }

  return (
    <div className="container">
      <h1>Altyazı Stüdyosu v3</h1>

      <div className="upload-box">
        <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />

        {/* Yeni Açılır Menü (Dropdown) */}
        <div className="language-selector">
          <label htmlFor="languageSelect">Altyazı Dili Seçin:</label>
          <select
            id="languageSelect"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            <option value="none">Sadece Metne Dök (İngilizce)</option>
            <option value="tr">Türkçe (Turkish)</option>
            <option value="de">Almanca (German)</option>
            <option value="es">İspanyolca (Spanish)</option>
            <option value="fr">Fransızca (French)</option>
            <option value="ja">Japonca (Japanese)</option>
          </select>
        </div>

        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'İşleniyor...' : 'Altyazı Çıkar'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {videoUrl && (
        <div className="studio-layout">
          <div className="video-section">
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              controls
              width="100%"
              key={subtitleUrl}
            >
              <source src={videoUrl} type={file?.type || 'video/mp4'} />
              {subtitleUrl && (
                <track
                  kind="subtitles"
                  src={subtitleUrl}
                  srcLang={targetLanguage === 'none' ? 'en' : targetLanguage}
                  label={getLanguageLabel()}
                  default
                />
              )}
            </video>
            {subtitleUrl && (
              <a href={subtitleUrl} download={`altyazi_${targetLanguage === 'none' ? 'en' : targetLanguage}.vtt`} className="download-btn" style={{marginTop: "1rem"}}>
                Düzenlenmiş Altyazıyı İndir (.vtt)
              </a>
            )}
          </div>

          {subtitles.length > 0 && (
            <div className="editor-section">
              <h3>Altyazı Editörü ({getLanguageLabel()})</h3>
              <div className="editor-list">
                {subtitles.map(sub => {
                  const isActive = currentTime >= sub.start && currentTime <= sub.end;
                  return (
                    <div key={sub.id} className={`editor-item ${isActive ? 'active-sub' : ''}`}>
                      <span className="time-badge" onClick={() => handleSeek(sub.start)}>
                        {sub.start_vtt.substring(3, 8)}
                      </span>
                      <textarea
                        value={sub.text}
                        onChange={(e) => handleTextChange(sub.id, e.target.value)}
                        rows="2"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App