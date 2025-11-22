import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react'
import { historyApi, songApi, getFileUrl } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export interface Song {
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
  listenCount?: number
}

export interface AudioState {
  // Current playback state
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  
  // Queue state
  queue: Song[]
  currentIndex: number
  
  
  // UI state
  isPlayerOpen: boolean
  hasAudioFile: boolean
  isLoading: boolean
  shouldAutoPlay: boolean
}

type AudioAction =
  | { type: 'SET_CURRENT_SONG'; payload: Song }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_QUEUE'; payload: Song[] }
  | { type: 'ADD_TO_QUEUE'; payload: Song[] }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'NEXT_SONG' }
  | { type: 'PREVIOUS_SONG' }
  | { type: 'TOGGLE_PLAYER'; payload?: boolean }
  | { type: 'SET_HAS_AUDIO_FILE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOULD_AUTO_PLAY'; payload: boolean }
  | { type: 'INCREMENT_LISTEN_COUNT' }
  | { type: 'CLEAR_QUEUE' }

const initialState: AudioState = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  currentIndex: -1,
  isPlayerOpen: false,
  hasAudioFile: false,
  isLoading: false,
  shouldAutoPlay: false
}

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_CURRENT_SONG':
      return {
        ...state,
        currentSong: action.payload,
        currentTime: 0,
        hasAudioFile: false,
        isLoading: true
      }
    
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload }
    
    case 'SET_DURATION':
      return { ...state, duration: action.payload }
    
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) }
    
    case 'SET_QUEUE':
      return { 
        ...state, 
        queue: action.payload,
        currentIndex: action.payload.length > 0 ? 0 : -1
      }
    
    case 'ADD_TO_QUEUE':
      return { 
        ...state, 
        queue: [...state.queue, ...action.payload]
      }
    
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter((_, index) => index !== action.payload)
      let newIndex = state.currentIndex
      
      if (action.payload < state.currentIndex) {
        newIndex = state.currentIndex - 1
      } else if (action.payload === state.currentIndex) {
        newIndex = Math.min(state.currentIndex, newQueue.length - 1)
      }
      
      return {
        ...state,
        queue: newQueue,
        currentIndex: newIndex
      }
    }
    
    case 'SET_CURRENT_INDEX':
      return { 
        ...state, 
        currentIndex: Math.max(-1, Math.min(action.payload, state.queue.length - 1))
      }
    
    case 'NEXT_SONG': {
      let nextIndex = state.currentIndex + 1
      
      if (nextIndex >= state.queue.length) {
        nextIndex = state.currentIndex // Stay at current song if at end
      }
      
      return { ...state, currentIndex: nextIndex, shouldAutoPlay: true }
    }
    
    case 'PREVIOUS_SONG': {
      let prevIndex = state.currentIndex - 1
      
      if (prevIndex < 0) {
        prevIndex = 0 // Stay at first song if at beginning
      }
      
      return { ...state, currentIndex: prevIndex, shouldAutoPlay: true }
    }
    
    
    case 'TOGGLE_PLAYER':
      return { 
        ...state, 
        isPlayerOpen: action.payload !== undefined ? action.payload : !state.isPlayerOpen 
      }
    
    case 'SET_HAS_AUDIO_FILE':
      return { ...state, hasAudioFile: action.payload, isLoading: false }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_SHOULD_AUTO_PLAY':
      return { ...state, shouldAutoPlay: action.payload }
    
    case 'INCREMENT_LISTEN_COUNT':
      if (!state.currentSong) return state
      
      const updatedSong = {
        ...state.currentSong,
        listenCount: (state.currentSong.listenCount || 0) + 1
      }
      
      // Update the current song and also update it in the queue if it exists there
      const updatedQueue = state.queue.map(song => 
        song.id === state.currentSong?.id ? updatedSong : song
      )
      
      return {
        ...state,
        currentSong: updatedSong,
        queue: updatedQueue
      }
    
    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: [],
        currentIndex: -1,
        currentSong: null,
        isPlaying: false,
        shouldAutoPlay: false
      }
    
    default:
      return state
  }
}

interface AudioContextValue {
  state: AudioState
  dispatch: React.Dispatch<AudioAction>
  audioRef: React.RefObject<HTMLAudioElement | null>
  
  // Convenience functions
  playSong: (song: Song, queue?: Song[], startIndex?: number, openPlayer?: boolean) => void
  playNext: () => void
  playPrevious: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  addToQueue: (songs: Song[]) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  
  // Listen count callback
  onListenCountUpdate?: (songId: string, newCount: number) => void
  setListenCountCallback: (callback: (songId: string, newCount: number) => void) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

// Export the hook at the end to satisfy react-refresh/only-export-components
export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

interface AudioProviderProps {
  children: React.ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [state, dispatch] = useReducer(audioReducer, initialState)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { user } = useAuth()
  
  // Track listening history
  const playStartTimeRef = useRef<number>(0)
  const totalListenTimeRef = useRef<number>(0)
  const hasStartedPlayingRef = useRef<boolean>(false)
  const hasIncrementedListenCount = useRef<boolean>(false)
  
  // Listen count callback
  const listenCountCallbackRef = useRef<((songId: string, newCount: number) => void) | null>(null)

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedData = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration })
      dispatch({ type: 'SET_HAS_AUDIO_FILE', payload: true })
      
      // Auto-play if this song change was triggered by next/previous
      if (state.shouldAutoPlay) {
        audio.play()
        dispatch({ type: 'SET_SHOULD_AUTO_PLAY', payload: false })
      }
    }

    const handleError = () => {
      dispatch({ type: 'SET_HAS_AUDIO_FILE', payload: false })
      console.error('Failed to load audio file:', state.currentSong?.audioFilePath)
    }

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime })
    }

    const handlePlay = async () => {
      dispatch({ type: 'SET_PLAYING', payload: true })
      hasStartedPlayingRef.current = true
      playStartTimeRef.current = Date.now()
      
      // Increment listen count only once per song
      if (!hasIncrementedListenCount.current && state.currentSong?.id) {
        hasIncrementedListenCount.current = true
        const currentSongId = state.currentSong.id
        const currentListenCount = state.currentSong.listenCount || 0
        
        try {
          await songApi.incrementListenCount(parseInt(currentSongId))
          // Update the frontend count after successful backend increment
          dispatch({ type: 'INCREMENT_LISTEN_COUNT' })
          
          // Notify callback about the listen count update with the correct new count
          if (listenCountCallbackRef.current) {
            const newCount = currentListenCount + 1
            listenCountCallbackRef.current(currentSongId, newCount)
          }
        } catch (error) {
          console.error('Failed to increment listen count:', error)
          // Reset flag if API call failed so we can try again
          hasIncrementedListenCount.current = false
        }
      }
    }

    const handlePause = () => {
      dispatch({ type: 'SET_PLAYING', payload: false })
      if (playStartTimeRef.current > 0) {
        const sessionDuration = (Date.now() - playStartTimeRef.current) / 1000
        totalListenTimeRef.current += sessionDuration
      }
    }

    const handleEnded = async () => {
      dispatch({ type: 'SET_PLAYING', payload: false })
      
      // Track listening history
      if (hasStartedPlayingRef.current && totalListenTimeRef.current > 0 && user?.userId && state.currentSong) {
        try {
          await historyApi.add({
            userId: user.userId,
            songId: parseInt(state.currentSong.id),
            duration: Math.round(totalListenTimeRef.current)
          })
        } catch (error) {
          console.error('Failed to track listening history:', error)
        }
      }
      
      // Auto-advance to next song if there is one
      if (state.currentIndex < state.queue.length - 1) {
        dispatch({ type: 'NEXT_SONG' })
      }
    }

    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [state.currentSong, state.currentIndex, state.queue.length, user?.userId])

  // Update audio source when current song changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state.currentSong?.audioFilePath) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_HAS_AUDIO_FILE', payload: false })
    
    // Reset tracking variables
    totalListenTimeRef.current = 0
    hasStartedPlayingRef.current = false
    playStartTimeRef.current = 0
    hasIncrementedListenCount.current = false

    const audioUrl = getFileUrl(state.currentSong.audioFilePath)
    audio.src = audioUrl
    audio.volume = state.volume
    audio.load() // Explicitly trigger loading
  }, [state.currentSong?.audioFilePath, state.volume])

  // Auto-play when queue index changes
  useEffect(() => {
    if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
      const newSong = state.queue[state.currentIndex]
      if (newSong.id !== state.currentSong?.id) {
        dispatch({ type: 'SET_CURRENT_SONG', payload: newSong })
      }
    }
  }, [state.currentIndex, state.queue])

  // Convenience functions
  const playSong = (song: Song, queue?: Song[], startIndex?: number, openPlayer: boolean = true) => {
    if (queue) {
      dispatch({ type: 'SET_QUEUE', payload: queue })
      dispatch({ type: 'SET_CURRENT_INDEX', payload: startIndex || 0 })
    } else {
      dispatch({ type: 'SET_QUEUE', payload: [song] })
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
    }
    
    dispatch({ type: 'SET_CURRENT_SONG', payload: song })
    dispatch({ type: 'SET_SHOULD_AUTO_PLAY', payload: true })
    dispatch({ type: 'TOGGLE_PLAYER', payload: openPlayer })
  }

  const playNext = () => {
    dispatch({ type: 'NEXT_SONG' })
  }

  const playPrevious = () => {
    dispatch({ type: 'PREVIOUS_SONG' })
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !state.hasAudioFile) return

    if (state.isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.currentTime = time
    dispatch({ type: 'SET_CURRENT_TIME', payload: time })
  }

  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume })
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }

  const addToQueue = (songs: Song[]) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: songs })
  }

  const removeFromQueue = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index })
  }

  const clearQueue = () => {
    dispatch({ type: 'CLEAR_QUEUE' })
  }

  const setListenCountCallback = (callback: (songId: string, newCount: number) => void) => {
    listenCountCallbackRef.current = callback
  }

  const contextValue: AudioContextValue = {
    state,
    dispatch,
    audioRef,
    playSong,
    playNext,
    playPrevious,
    togglePlayPause,
    seek,
    setVolume,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setListenCountCallback
  }

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} />
    </AudioContext.Provider>
  )
}