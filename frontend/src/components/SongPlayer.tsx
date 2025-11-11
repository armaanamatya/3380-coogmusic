import React, { useState, useEffect, useRef } from 'react'
import { getFileUrl } from '../services/api'

interface SongPlayerProps {
  isOpen: boolean
  onClose: () => void
  song: {
    id: string
    title: string
    artist: string
    audioFilePath?: string
    imageUrl?: string
    duration?: number
  } | null
}

export const SongPlayer: React.FC<SongPlayerProps> = ({ isOpen, onClose, song }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasAudioFile, setHasAudioFile] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (song?.audioFilePath && audioRef.current) {
      const audio = audioRef.current
      
      // Check if audio file actually exists/loads
      const handleLoadedData = () => {
        setHasAudioFile(true)
        setDuration(audio.duration)
      }
      
      const handleError = () => {
        setHasAudioFile(false)
        console.error('Failed to load audio file:', song.audioFilePath)
      }
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
      }

      audio.addEventListener('loadeddata', handleLoadedData)
      audio.addEventListener('error', handleError)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      
      // Reset state when song changes
      setIsPlaying(false)
      setCurrentTime(0)
      setHasAudioFile(false)
      
      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [song?.audioFilePath])

  const togglePlayPause = () => {
    if (!audioRef.current || !hasAudioFile) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const newTime = parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isOpen || !song) return null

  const audioUrl = song.audioFilePath ? getFileUrl(song.audioFilePath) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Now Playing</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Song Info */}
        <div className="text-center mb-6">
          {song.imageUrl && (
            <img 
              src={song.imageUrl} 
              alt={song.title}
              className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
            />
          )}
          <h4 className="text-xl font-bold text-gray-800">{song.title}</h4>
          <p className="text-gray-600">{song.artist}</p>
        </div>

        {/* Audio Player */}
        {audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} />
            
            {hasAudioFile ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Play/Pause Button */}
                <div className="flex justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Loading audio file...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No audio file available</p>
            <p className="text-gray-400 text-sm mt-1">This song doesn't have an uploaded audio file</p>
          </div>
        )}
      </div>
    </div>
  )
}