import { IncomingMessage, ServerResponse } from 'http';
import { Database } from 'better-sqlite3';

// Re-export HTTP types for external use
export { ServerResponse } from 'http';

// Extended request type with parsed body and files
export interface ExtendedRequest extends IncomingMessage {
  body?: any;
  file?: any;
  files?: any;
}

// Handler function type
export interface RouteHandler {
  (req: ExtendedRequest, res: ServerResponse, db: Database): Promise<void>;
}

// User types
export interface UserProfile {
  UserID: number;
  Username: string;
  UserPassword: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Email: string;
  UserType: 'Listener' | 'Artist' | 'Administrator' | 'Analyst';
  DateJoined: string;
  Country: string;
  City: string | null;
  AccountStatus: 'Active' | 'Suspended' | 'Banned';
  IsOnline: number;
  LastLogin: string | null;
  ProfilePicture: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface RegisterUserData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  userType: 'Listener' | 'Artist' | 'Administrator' | 'Analyst';
  country: string;
  city?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Artist types
export interface Artist {
  ArtistID: number;
  ArtistBio: string | null;
  ArtistPFP: Buffer | null;
  VerifiedStatus: number;
  VerifyingAdminID: number | null;
  DateVerified: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

// Genre types
export interface Genre {
  GenreID: number;
  GenreName: string;
  Description: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

// Album types
export interface Album {
  AlbumID: number;
  AlbumName: string;
  ArtistID: number;
  ReleaseDate: string;
  AlbumCover: string | null;
  Description: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateAlbumData {
  albumName: string;
  artistId: number;
  releaseDate?: string;
  description?: string;
}

export interface UpdateAlbumData {
  AlbumName?: string;
  AlbumDate?: string;
  AlbumDescription?: string;
}

// Song types
export interface Song {
  SongID: number;
  SongName: string;
  ArtistID: number;
  AlbumID: number | null;
  GenreID: number | null;
  Duration: number;
  ListenCount: number;
  FilePath: string;
  FileSize: number;
  ReleaseDate: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateSongData {
  SongName?: string;
  AlbumID?: number | null;
  GenreID?: number | null;
  SongLength?: number;
  AlbumDate?: string;
}

export interface UploadMusicData {
  songName: string;
  artistId: number;
  albumId?: number;
  genreId?: number;
  duration: string;
  fileFormat?: string;
}

// Playlist types
export interface Playlist {
  PlaylistID: number;
  PlaylistName: string;
  UserID: number;
  Description: string | null;
  IsPublic: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreatePlaylistData {
  playlistName: string;
  userId: number;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistData {
  PlaylistName?: string;
  Description?: string;
  IsPublic?: number;
}

// User profile management types
export interface UpdateUserData {
  Username?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Country?: string;
  City?: string;
  DateOfBirth?: string;
}

// Listening history types
export interface ListeningHistory {
  HistoryID: number;
  UserID: number;
  SongID: number;
  ListenedAt: string;
  Duration: number | null;
}

export interface AddListeningHistoryData {
  userId: number;
  songId: number;
  duration?: number;
}

// Response helpers
export interface SuccessResponse<T = any> {
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

