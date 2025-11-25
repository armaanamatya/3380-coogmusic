# Seed Data Audio Files

This directory contains audio files for seed data songs. The directory structure should match the FilePath values in the seed data SQL file.

## Directory Structure

Based on `seedData/seed_data.sql`, the expected structure is:

```
music/
├── taylor_swift/
│   ├── folklore/
│   │   ├── the_1.mp3
│   │   ├── cardigan.mp3
│   │   ├── tlgad.mp3
│   │   ├── exile.mp3
│   │   └── ...
│   ├── evermore/
│   │   ├── willow.mp3
│   │   ├── champagne_problems.mp3
│   │   └── ...
│   └── midnights/
│       ├── anti_hero.mp3
│       └── ...
├── ed_sheeran/
│   ├── divide/
│   │   ├── shape_of_you.mp3
│   │   └── ...
│   └── ...
└── ...
```

## Adding Files

1. Place audio files in the appropriate subdirectories matching the seed data paths
2. File names should match exactly what's in the `FilePath` column in `seedData/seed_data.sql`
3. Supported formats: MP3, WAV, FLAC, M4A, AAC

## Note

- This directory is included in git (unlike `uploads/` which is for user-uploaded content)
- Files in this directory will be deployed with the application
- The server serves files from `/music/...` paths directly

