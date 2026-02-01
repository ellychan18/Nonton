import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Film } from 'lucide-react'
import { useBookDetail, useChapters } from '../hooks'
import { useLanguage } from '../store/language'

export default function Watch() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { book, loading: bookLoading } = useBookDetail(id!)
  const { chapters, loading: chaptersLoading } = useChapters(id!)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [videoUrl, setVideoUrl] = useState('')
  const [subtitles, setSubtitles] = useState<{ languageCode: string; languageName: string; subtitlesUrl: string }[]>([])
  const [videoLoading, setVideoLoading] = useState(false)
  const { lang } = useLanguage()

  useEffect(() => {
    if (!chapters.length) return
    
    const fetchVideo = async () => {
      // Logic gembok episode 30 sudah dihapus total di sini
      setVideoLoading(true)
      try {
        const chapter = chapters[currentEpisode - 1]
        if (!chapter) return
        
        const res = await fetch(`/api/book/getChapterDetail?bid=${id}&chapterResourceId=${chapter.id}&lang=${lang}`)
        const data = await res.json()
        
        if (data.message === 'ok') {
          // Mengambil source video dan subtitle secara langsung
          setVideoUrl(data.chapter.bookChapterResource.normalSourceUrl)
          setSubtitles(data.chapter.bookChapterResource.subtitles || [])
        }
      } catch (e) {
        console.error("Gagal mengambil data video:", e)
      } finally {
        setVideoLoading(false)
      }
    }
    fetchVideo()
  }, [chapters, currentEpisode, id, lang])

  const handleEpisodeChange = (ep: number) => {
    // Validasi range episode agar tidak out of bounds
    if (ep >= 1 && ep <= chapters.length) {
      setCurrentEpisode(ep)
      // Scroll ke atas otomatis saat ganti episode agar video terlihat
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleVideoEnded = () => {
    if (currentEpisode < chapters.length) {
      handleEpisodeChange(currentEpisode + 1)
    }
  }

  if (bookLoading || chaptersLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-zinc-400 mb-4">Drama tidak ditemukan</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-red-600 rounded-lg font-bold">Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center h-16 px-4 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold line-clamp-1 flex-1 mx-4 text-sm uppercase tracking-wider">{book.name}</h1>
        </div>
      </div>

      {/* Player Area */}
      <div className="pt-16">
        <div className="relative bg-black aspect-[9/16] w-full max-w-md mx-auto overflow-hidden shadow-2xl">
          {videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Loading Video</span>
              </div>
            </div>
          )}
          
          <video
            key={videoUrl}
            src={videoUrl}
            poster={book.cover || undefined}
            controls
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          >
            {subtitles.map(sub => (
              <track
                key={sub.languageCode}
                kind="subtitles"
                src={`/api/subtitle?url=${encodeURIComponent(sub.subtitlesUrl)}`}
                srcLang={sub.languageCode}
                label={sub.languageName}
                default={sub.languageCode === 'id' || sub.languageCode === 'en'}
              />
            ))}
          </video>
        </div>

        {/* Info & Navigation */}
        <div className="p-5 max-w-md mx-auto space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-2">
               <span className="px-2 py-0.5 bg-red-600/10 text-red-500 text-[10px] font-black uppercase rounded border border-red-500/20">Episode {currentEpisode}</span>
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{chapters.length} Episodes Total</span>
            </div>
            <h2 className="text-xl font-black italic tracking-tight mb-3">{book.name}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5 italic">
              "{book.description}"
            </p>
          </div>

          {/* Quick Nav Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleEpisodeChange(currentEpisode - 1)}
              disabled={currentEpisode <= 1}
              className="flex-1 py-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 disabled:opacity-20 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <ChevronLeft size={20} /> <span className="text-[10px] font-black uppercase">Prev</span>
            </button>
            <button
              onClick={() => handleEpisodeChange(currentEpisode + 1)}
              disabled={currentEpisode >= chapters.length}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-20 rounded-2xl flex items-center justify-center gap-2 text-white shadow-lg shadow-red-600/20 transition-all"
            >
              <span className="text-[10px] font-black uppercase">Next</span> <ChevronRight size={20} />
            </button>
          </div>

          {/* Episode Selection Grid */}
          <div className="bg-zinc-900/30 p-4 rounded-3xl border border-white/5">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Film size={14} className="text-red-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Playlist</h3>
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {chapters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleEpisodeChange(i + 1)}
                  className={`aspect-square rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center ${
                    currentEpisode === i + 1 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-110 z-10' 
                      : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 border border-white/[0.02]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}