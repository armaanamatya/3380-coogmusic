import React, { useState } from 'react'
import { getFileUrl } from '../services/api'
import { useAudio } from '../contexts/AudioContext'
import { StarRating } from './StarRating'
import { LikeButton } from './LikeButton'

interface SongPlayerProps {
  isOpen: boolean
  onClose: () => void
  userId?: number
  onRate?: (songId: number, rating: number) => void
  onToggleLike?: (songId: number) => void
  isRatingLoading?: boolean
  isLikeLoading?: boolean
}

export const SongPlayer: React.FC<SongPlayerProps> = ({ isOpen, onClose, userId, onRate, onToggleLike, isRatingLoading, isLikeLoading }) => {
  const { state, togglePlayPause, playNext, playPrevious, seek, dispatch } = useAudio()
  const [showStats, setShowStats] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  
  const song = state.currentSong

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

  // Note: History tracking is now handled by AudioContext automatically

  // Note: History tracking is now handled by AudioContext automatically

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_PLAYER', payload: false })
    onClose()
  }

  const handleTogglePlayPause = () => {
    togglePlayPause()
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    seek(newTime)
  }

  const handlePrevious = () => {
    playPrevious()
  }

  const handleNext = () => {
    playNext()
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isOpen || !song) return null

  const audioUrl = song.audioFilePath ? getFileUrl(song.audioFilePath) : null
  const hasNextSong = state.currentIndex < state.queue.length - 1
  const hasPrevSong = state.currentIndex > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Listen Count:</span>
                  <span className="font-medium">{(song.listenCount || 0).toLocaleString()}</span>
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

        {/* Audio Player Controls */}
        {audioUrl ? (
          <>
            {state.hasAudioFile ? (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="w-full">
                  <input
                    type="range"
                    min="0"
                    max={state.duration || 0}
                    value={state.currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{formatTime(state.currentTime)}</span>
                    <span>{formatTime(state.duration)}</span>
                  </div>
                </div>


                {/* Main Controls */}
                <div className="flex justify-center items-center space-x-6">
                  {/* Previous */}
                  <button
                    onClick={handlePrevious}
                    disabled={!hasPrevSong}
                    className="p-3 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
                    title="Previous"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={handleTogglePlayPause}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 flex items-center justify-center transition-colors"
                  >
                    {state.isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Next */}
                  <button
                    onClick={handleNext}
                    disabled={!hasNextSong}
                    className="p-3 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
                    title="Next"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
                    </svg>
                  </button>
                </div>


                {/* Queue Info */}
                {state.queue.length > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span>Playing {state.currentIndex + 1} of {state.queue.length}</span>
                    <button
                      onClick={() => setShowQueue(!showQueue)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      {showQueue ? 'Hide' : 'Show'} Queue
                    </button>
                  </div>
                )}

                {/* Queue Display */}
                {showQueue && state.queue.length > 1 && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-gray-800 mb-3">Up Next</h4>
                    <div className="space-y-2">
                      {state.queue.map((queueSong, index) => (
                        <div
                          key={`${queueSong.id}-${index}`}
                          className={`flex items-center space-x-3 p-2 rounded ${index === state.currentIndex ? 'bg-red-50 text-red-600' : 'hover:bg-white'}`}
                        >
                          <span className="text-sm w-6 text-center">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{queueSong.title}</p>
                            <p className="text-xs text-gray-500 truncate">{queueSong.artist}</p>
                          </div>
                          {index === state.currentIndex && (
                            <div className="text-red-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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