import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
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
      // Python API'mize dosyayı gönderiyoruz
      const response = await axios.post('http://127.0.0.1:8000/upload-video/', formData, {
        responseType: 'blob', // Gelen yanıtın bir dosya (.srt) olduğunu belirtiyoruz
      })

      // Gelen SRT dosyasını otomatik olarak indirme işlemi
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'altyazi.srt')
      document.body.appendChild(link)
      link.click()
      link.remove()

      setMessage('İşlem başarılı! Altyazı dosyası indirildi.')
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
      <p>İngilizce videonuzu yükleyin, .srt dosyanızı saniyeler içinde alın.</p>

      <div className="upload-box">
        <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'İşleniyor...' : 'Altyazı Çıkar'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default App