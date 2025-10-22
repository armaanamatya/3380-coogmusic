# Deployment Instructions for Vercel

## Frontend Deployment

1. **Environment Variables**: Set the following environment variable in your Vercel dashboard:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app` or your deployed backend URL)

2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

## Backend Deployment

If deploying the backend separately, make sure to:
1. Set up your database (SQLite file or external database)
2. Configure CORS to allow your frontend domain
3. Set up file upload handling for profile pictures

## Routing Configuration

The following files have been configured for proper client-side routing:
- `vercel.json`: Handles all routes by redirecting to index.html
- `public/_redirects`: Backup routing configuration

## Common Issues

1. **404 Errors**: Make sure `vercel.json` is in the root of your frontend directory
2. **API Connection Issues**: Verify the `VITE_API_URL` environment variable is set correctly
3. **Build Failures**: Ensure all dependencies are installed and TypeScript compiles without errors
