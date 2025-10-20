import { useState } from 'react'

interface ContentItem {
  id: string
  title: string
  type: 'song' | 'artist' | 'playlist' | 'album'
  imageUrl?: string
  artist?: string
}

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Placeholder data - replace with actual API calls later
  const contentItems: ContentItem[] = [
    { id: '1', title: 'Summer Vibes', type: 'playlist', imageUrl: '/api/placeholder/200/200' },
    { id: '2', title: 'The Weeknd', type: 'artist', imageUrl: '/api/placeholder/200/200' },
    { id: '3', title: 'Blinding Lights', type: 'song', artist: 'The Weeknd', imageUrl: '/api/placeholder/200/200' },
    { id: '4', title: 'After Hours', type: 'album', artist: 'The Weeknd', imageUrl: '/api/placeholder/200/200' },
    { id: '5', title: 'Chill Beats', type: 'playlist', imageUrl: '/api/placeholder/200/200' },
    { id: '6', title: 'Taylor Swift', type: 'artist', imageUrl: '/api/placeholder/200/200' },
    { id: '7', title: 'Anti-Hero', type: 'song', artist: 'Taylor Swift', imageUrl: '/api/placeholder/200/200' },
    { id: '8', title: 'Midnights', type: 'album', artist: 'Taylor Swift', imageUrl: '/api/placeholder/200/200' },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'song': return 'bg-blue-100 text-blue-800'
      case 'artist': return 'bg-green-100 text-green-800'
      case 'playlist': return 'bg-purple-100 text-purple-800'
      case 'album': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src="/api/placeholder/120/120"
              alt="User profile"
              className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-md"
            />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">John Doe</h2>
              <p className="text-sm text-gray-500">Premium Member</p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  My Music
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Playlists
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Artists
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search for songs, artists, playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                    {item.type}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                {item.artist && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{item.artist}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default HomePage