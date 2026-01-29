# Deploying Fixora Backend to Render

## Quick Setup

### Option 1: Using Render Dashboard (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   - **Name:** `fixora-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" for each:
   
   ```
   MONGO_URL=your-mongodb-connection-string
   DB_NAME=IP
   JWT_SECRET_KEY=your-secret-key
   CORS_ORIGINS=https://your-frontend-url.com
   SENDER_EMAIL=your-email@gmail.com
   GOOGLE_APP_PASSWORD=your-app-password
   GITHUB_CLIENT_ID=Iv23li11A1tGpDgFhQTh
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_PUBLIC_LINK=https://github.com/apps/fixora26
   BACKEND_URL=https://your-app.onrender.com
   HF_TOKEN=your-huggingface-token
   ```

6. **Click "Create Web Service"**

7. **Wait for deployment** (3-5 minutes)

8. **Copy your service URL** (e.g., `https://fixora-backend.onrender.com`)

9. **Update GitHub App settings:**
   - Go to https://github.com/settings/apps/fixora26
   - Update callback URL if needed
   - Set permissions (Contents: Read and write, Workflows: Read and write)

10. **Test your deployment:**
    ```bash
    curl https://your-app.onrender.com/health
    # Should return: {"status":"healthy"}
    ```

### Option 2: Using render.yaml (Automated)

1. The `render.yaml` file is already configured in the root directory

2. Go to [Render Dashboard](https://dashboard.render.com/)

3. Click "New +" → "Blueprint"

4. Connect your repository

5. Render will automatically detect `render.yaml` and set up the service

6. Manually add the environment variable values in the dashboard

## Important Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URL` | ✅ Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `BACKEND_URL` | ✅ Yes | Your Render service URL | `https://fixora-backend.onrender.com` |
| `GITHUB_CLIENT_ID` | ✅ Yes | GitHub App client ID | `Iv23li11A1tGpDgFhQTh` |
| `GITHUB_CLIENT_SECRET` | ✅ Yes | GitHub App client secret | From GitHub App settings |
| `CORS_ORIGINS` | ✅ Yes | Frontend URL | `https://your-frontend.vercel.app` |
| `JWT_SECRET_KEY` | ✅ Yes | Random secret key | Generate with `openssl rand -hex 32` |
| `SENDER_EMAIL` | ⚠️ Optional | For email features | `your-email@gmail.com` |
| `GOOGLE_APP_PASSWORD` | ⚠️ Optional | For email features | From Google App Passwords |
| `HF_TOKEN` | ⚠️ Optional | HuggingFace token | From HuggingFace settings |

## After Deployment

1. **Copy your Render URL** (e.g., `https://fixora-backend.onrender.com`)

2. **Set `BACKEND_URL` environment variable** in Render to your own URL

3. **Update frontend `.env`:**
   ```env
   REACT_APP_API_URL=https://your-render-url.onrender.com
   ```

4. **Test health endpoint:**
   ```bash
   curl https://your-render-url.onrender.com/api/health
   ```

5. **Connect GitHub in Fixora UI** and start scanning!

## Troubleshooting

### "Port scan timeout" error
- ✅ **Fixed!** The start command now uses `--host 0.0.0.0 --port $PORT`

### Service keeps crashing
- Check the logs in Render dashboard
- Verify all required environment variables are set
- Check MongoDB connection string is correct

### CORS errors
- Ensure `CORS_ORIGINS` includes your frontend URL
- Don't include trailing slashes

### GitHub webhook fails
- Ensure `BACKEND_URL` is set to your Render URL (not localhost)
- Test: `curl https://your-url.onrender.com/api/health`

## Free Tier Limitations

Render free tier:
- Service spins down after 15 minutes of inactivity
- Cold starts take 30-60 seconds
- 750 hours/month free

For production, consider upgrading to a paid plan for always-on service.
