import React from 'react'
import { useAudio } from '../contexts/AudioContext'

interface MiniPlayerProps {
  onOpenFullPlayer: () => void
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onOpenFullPlayer }) => {
  const { state, togglePlayPause, playNext, playPrevious, seek } = useAudio()
  
  const song = state.currentSong

  // Don't render if no song is playing or if the full player is open
  if (!song || state.isPlayerOpen) return null

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    seek(newTime)
  }

  const hasNextSong = state.currentIndex < state.queue.length - 1
  const hasPrevSong = state.currentIndex > 0

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      {/* Progress Bar */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max={state.duration || 0}
          value={state.currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-200 appearance-none cursor-pointer slider absolute top-0"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Mini Player Content */}
      <div className="flex items-center justify-between px-4 py-3 pt-4">
        {/* Song Info - Left Side */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={onOpenFullPlayer}>
          {song.imageUrl && (
            <img 
              src={song.imageUrl} 
              alt={song.title}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-800 truncate">{song.title}</h4>
            <p className="text-xs text-gray-600 truncate">{song.artist}</p>
          </div>
        </div>

        {/* Controls - Center */}
        <div className="flex items-center space-x-2 px-4">
          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={!hasPrevSong}
            className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
            title="Previous"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            disabled={!state.hasAudioFile}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            {state.isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={!hasNextSong}
            className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
            title="Next"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
            </svg>
          </button>
        </div>

        {/* Time and Expand - Right Side */}
        <div className="flex items-center space-x-3">
          {/* Time Display */}
          <div className="text-xs text-gray-500 font-medium">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>

          {/* Expand Button */}
          <button
            onClick={onOpenFullPlayer}
            className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Open full player"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}