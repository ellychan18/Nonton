import axios from 'axios';

const API_URL = process.env.API_URL || 'https://captain.sapimu.au/dreamshort';
const TOKEN = process.env.AUTH_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.replace('/api', '');
  const [pathname, queryString] = path.split('?');

  // Proxy subtitle
  if (pathname === '/subtitle') {
    const params = new URLSearchParams(queryString);
    const url = params.get('url');
    if (!url) return res.status(400).send('');
    try {
      const response = await axios.get(url, { responseType: 'text' });
      res.setHeader('Content-Type', 'text/vtt');
      // Konversi format subtitle SRT ke VTT agar support di player browser
      const vtt = 'WEBVTT\n\n' + response.data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      return res.send(vtt);
    } catch (err) {
      return res.status(500).send('');
    }
  }

  if (!TOKEN) {
    return res.status(500).json({ error: 'AUTH_TOKEN not configured' });
  }

  try {
    const url = `${API_URL}${pathname}${queryString ? '?' + queryString : ''}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    // --- BAGIAN LOCK SUDAH DIHAPUS (BYPASS) ---
    // Sekarang semua episode (1-100+) akan langsung terbuka
    
    res.json(response.data);
  } catch (err) {
    // Pesan error dibuat lebih clean
    res.status(err.response?.status || 500).json({ 
      error: 'API Connection Error',
      message: err.message
    });
  }
}