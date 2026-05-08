import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)
  const [translateTr, setTranslateTr] = useState(false)
  const [subtitles, setSubtitles] = useState([])

  // Yeni: Videonun o anki saniyesini tutacağımız state
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setVideoUrl(selectedFile ? URL.createObjectURL(selectedFile) : null)
    setSubtitles([])
    setSubtitleUrl(null)
  }

  // Yeni: Video oynarken saniyeyi sürekli state'e kaydet
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
    setMessage('Video işleniyor, lütfen bekleyin...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('translate_to_tr', translateTr)

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-video/', formData)
      setSubtitles(response.data.subtitles)
      setMessage('İşlem başarılı! Konuşulan satır sağda parlayacaktır.')
    } catch (error) {
      console.error(error)
      setMessage('Bir hata oluştu.')
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

  return (
    <div className="container">
      <h1>Altyazı Stüdyosu v2</h1>

      <div className="upload-box">
        <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />
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
        <div className="studio-layout">
          <div className="video-section">
            {/* onTimeUpdate eklendi: Video her aktığında saniyeyi kaydeder */}
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              controls
              width="100%"
              key={subtitleUrl}
            >
              <source src={videoUrl} type={file?.type || 'video/mp4'} />
              {subtitleUrl && (
                <track kind="subtitles" src={subtitleUrl} srcLang={translateTr ? "tr" : "en"} label={translateTr ? "Türkçe" : "English"} default />
              )}
            </video>
            {subtitleUrl && (
              <a href={subtitleUrl} download="altyazi.vtt" className="download-btn" style={{marginTop: "1rem"}}>
                Düzenlenmiş Altyazıyı İndir (.vtt)
              </a>
            )}
          </div>

          {subtitles.length > 0 && (
            <div className="editor-section">
              <h3>Altyazı Editörü</h3>
              <div className="editor-list">
                {subtitles.map(sub => {
                  // O anki saniye bu altyazının aralığında mı kontrol et
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