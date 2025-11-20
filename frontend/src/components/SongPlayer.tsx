import React, { useState, useEffect, useRef } from 'react'
import { getFileUrl, historyApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { StarRating } from './StarRating'
import { LikeButton } from './LikeButton'

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
    averageRating?: number
    totalRatings?: number
    userRating?: number | null
    isLiked?: boolean
    likeCount?: number
  } | null
  userId?: number
  onRate?: (songId: number, rating: number) => void
  onToggleLike?: (songId: number) => void
  isRatingLoading?: boolean
  isLikeLoading?: boolean
}

export const SongPlayer: React.FC<SongPlayerProps> = ({ isOpen, onClose, song, userId, onRate, onToggleLike, isRatingLoading, isLikeLoading }) => {
  const { user } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasAudioFile, setHasAudioFile] = useState(false)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playStartTimeRef = useRef<number>(0)
  const totalListenTimeRef = useRef<number>(0)

  const handleRate = (rating: number) => {
    if (onRate && userId && song) {
      onRate(parseInt(song.id), rating)
    }
  }

  const handleToggleLike = () => {
    if (onToggleLike && userId && song) {
      onToggleLike(parseInt(song.id))
    }
  }

  // Function to track listening history
  const trackListeningHistory = async () => {
    if (!user?.userId || !song?.id || !hasStartedPlaying) return
    
    try {
      await historyApi.add({
        userId: user.userId,
        songId: parseInt(song.id),
        duration: Math.round(totalListenTimeRef.current)
      })
      console.log('Listening history tracked for song:', song.title)
    } catch (error) {
      console.error('Failed to track listening history:', error)
    }
  }

  // Reset history tracking when song changes
  useEffect(() => {
    setHasStartedPlaying(false)
    totalListenTimeRef.current = 0
    playStartTimeRef.current = 0
  }, [song?.id])

  // Track listening when component unmounts or song changes
  useEffect(() => {
    return () => {
      if (hasStartedPlaying && totalListenTimeRef.current > 0) {
        trackListeningHistory()
      }
    }
  }, [song?.id, hasStartedPlaying, user?.userId])

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

      const handlePlay = () => {
        setIsPlaying(true)
        if (!hasStartedPlaying) {
          setHasStartedPlaying(true)
        }
        playStartTimeRef.current = Date.now()
      }

      const handlePause = () => {
        setIsPlaying(false)
        if (playStartTimeRef.current > 0) {
          const sessionDuration = (Date.now() - playStartTimeRef.current) / 1000
          totalListenTimeRef.current += sessionDuration
        }
      }

      const handleEnded = async () => {
        setIsPlaying(false)
        if (playStartTimeRef.current > 0) {
          const sessionDuration = (Date.now() - playStartTimeRef.current) / 1000
          totalListenTimeRef.current += sessionDuration
        }
        
        // Track full listening history when song ends
        if (hasStartedPlaying && totalListenTimeRef.current > 0) {
          await trackListeningHistory()
        }
      }

      audio.addEventListener('loadeddata', handleLoadedData)
      audio.addEventListener('error', handleError)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('ended', handleEnded)
      
      // Reset state when song changes
      setIsPlaying(false)
      setCurrentTime(0)
      setHasAudioFile(false)
      
      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [song?.audioFilePath])

  const handleClose = async () => {
    // Track listening history before closing
    if (hasStartedPlaying && totalListenTimeRef.current > 0) {
      await trackListeningHistory()
    }
    onClose()
  }

  const togglePlayPause = () => {
    if (!audioRef.current || !hasAudioFile) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
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
            onClick={handleClose}
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

        {/* Ratings and Likes Section */}
        <div className="mb-6 border-t border-gray-200 pt-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            {/* Rating */}
            <div className="flex flex-col items-center">
              <StarRating
                rating={song.averageRating || 0}
                userRating={song.userRating || null}
                totalRatings={song.totalRatings || 0}
                onRate={userId ? handleRate : undefined}
                readonly={!userId}
                size="medium"
                showStats={false}
                loading={isRatingLoading}
              />
              {song.totalRatings ? (
                <span className="text-xs text-gray-500 mt-1">
                  {song.totalRatings} rating{song.totalRatings !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            {/* Like */}
            <div className="flex flex-col items-center">
              <LikeButton
                isLiked={song.isLiked || false}
                likeCount={song.likeCount || 0}
                onToggleLike={userId ? handleToggleLike : undefined}
                size="medium"
                showCount={false}
                loading={isLikeLoading}
              />
              {song.likeCount ? (
                <span className="text-xs text-gray-500 mt-1">
                  {song.likeCount} like{song.likeCount !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
          </div>

          {/* Stats Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center mx-auto"
            >
              {showStats ? 'Hide' : 'Show'} Stats
              <svg 
                className={`w-4 h-4 ml-1 transform transition-transform ${showStats ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expanded Stats */}
          {showStats && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-3">Song Statistics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating:</span>
                  <span className="font-medium">
                    {song.averageRating ? `${song.averageRating.toFixed(1)}/5.0` : 'No ratings'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Ratings:</span>
                  <span className="font-medium">{song.totalRatings || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Likes:</span>
                  <span className="font-medium">{song.likeCount || 0}</span>
                </div>
                {song.userRating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Rating:</span>
                    <span className="font-medium">{song.userRating}/5</span>
                  </div>
                )}
              </div>
            </div>
          )}
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