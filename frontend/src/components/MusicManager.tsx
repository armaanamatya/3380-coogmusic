import React, { useState } from 'react';
import MusicUploadForm from './MusicUploadForm';
import MusicLibrary from './MusicLibrary';
import MusicEditForm from './MusicEditForm';
import AlbumManager from './AlbumManager';

interface Song {
  SongID: number;
  SongName: string;
  ArtistID: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumID?: number;
  AlbumName?: string;
  GenreID?: number;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
  FilePath: string;
  FileSize: number;
  ReleaseDate: string;
  CreatedAt: string;
}

type ActiveTab = 'library' | 'upload' | 'albums' | 'edit';

const MusicManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setActiveTab('edit');
  };

  const handleUploadSuccess = () => {
    setActiveTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdateSuccess = () => {
    setEditingSong(null);
    setActiveTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSong = (_songId: number) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingSong(null);
    setActiveTab('library');
  };

  const tabs = [
    { id: 'library', label: 'Music Library', icon: '🎵' },
    { id: 'upload', label: 'Upload Music', icon: '⬆️' },
    { id: 'albums', label: 'Manage Albums', icon: '💿' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Music Manager</h1>
              <p className="text-gray-600">Upload, edit, and manage your music library</p>
            </div>
            
            {activeTab === 'edit' && editingSong && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Library</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {activeTab !== 'edit' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'library' && (
          <MusicLibrary
            onEditSong={handleEditSong}
            onDeleteSong={handleDeleteSong}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <MusicUploadForm
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setActiveTab('library')}
            />
          </div>
        )}

        {activeTab === 'albums' && (
          <AlbumManager refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'edit' && editingSong && (
          <div className="max-w-4xl mx-auto">
            <MusicEditForm
              song={editingSong}
              onUpdateSuccess={handleUpdateSuccess}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Upload Guidelines</h3>
              <ul className="space-y-1">
                <li>• Supported formats: MP3, WAV, FLAC, M4A, AAC</li>
                <li>• Maximum file size: 50MB</li>
                <li>• High quality audio recommended</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">File Management</h3>
              <ul className="space-y-1">
                <li>• Edit song metadata after upload</li>
                <li>• Organize songs into albums</li>
                <li>• Assign genres for better discovery</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Album Management</h3>
              <ul className="space-y-1">
                <li>• Create albums to group songs</li>
                <li>• Update album information</li>
                <li>• Albums can only be deleted if empty</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicManager;