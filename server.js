import express from 'express'
import axios from 'axios'
import { config } from 'dotenv'

config()

const app = express()
const API_URL = process.env.API_URL || 'https://captain.sapimu.au/dreamshort'
const TOKEN = process.env.AUTH_TOKEN

app.use('/api', async (req, res) => {
  const path = req.path
  
  // 1. Proxy subtitle (Bypass CORS & Convert SRT to VTT)
  if (path === '/subtitle') {
    const subtitleUrl = req.query.url;
    if (!subtitleUrl) return res.status(400).send('Missing subtitle URL');
    
    try {
      const response = await axios.get(subtitleUrl, { responseType: 'text' })
      res.setHeader('Content-Type', 'text/vtt')
      res.setHeader('Access-Control-Allow-Origin', '*')
      
      const vtt = 'WEBVTT\n\n' + response.data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
      return res.send(vtt)
    } catch (err) {
      return res.status(500).send('')
    }
  }
  
  // 2. Main API Proxy
  try {
    if (!TOKEN) throw new Error('AUTH_TOKEN is missing');

    const response = await axios.get(`${API_URL}${path}`, {
      params: req.query,
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    // --- BYPASS LOCK BERHASIL ---
    // Semua logika pengecekan episode >= 30 sudah dihapus total.
    // Sekarang semua data dikembalikan secara utuh ke frontend.
    
    res.json(response.data)
  } catch (err) {
    // Memberikan respon error yang lebih bersih
    res.status(err.response?.status || 500).json({ 
      success: false,
      error: 'API Proxy Error',
      message: err.message
    })
  }
})

// Melayani File Statis (Frontend Build)
app.use(express.static('dist'))

// Handle SPA Routing
app.get('*', (req, res) => {
  // Pastikan path root 'dist' sesuai dengan lokasi file index.html Bos
  res.sendFile('index.html', { root: 'dist' })
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`🚀 Server Unlocked running on port ${PORT}`)
})