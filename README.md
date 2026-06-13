# Movieflix Backend

Express API for Movieflix authentication, profile management, Cloudinary uploads, and saved movie lists.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
YOUTUBE_API_KEY=your_youtube_data_api_key
YOUTUBE_CACHE_TTL_MINUTES=30
LOGIN_RATE_LIMIT_MAX=8
LOGIN_RATE_LIMIT_WINDOW_MINUTES=15
PASSWORD_RESET_RATE_LIMIT_MAX=5
PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES=30
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://127.0.0.1:5173
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174
NODEMAILER_HOST=smtp.example.com
NODEMAILER_PORT=465
NODEMAILER_SECURE=true
NODEMAILER_EMAIL=your_email@example.com
NODEMAILER_PASSWORD=your_email_app_password
NODEMAILER_FROM=Movieflix Support <your_email@example.com>
NODEMAILER_REJECT_UNAUTHORIZED=false
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Scripts

```bash
npm run dev
npm run start
npm run check
npm run admin:promote -- user@example.com
npm run admin:promote:apply -- user@example.com
npm run cleanup:movies
npm run cleanup:movies:apply
npm run seed:curation
npm run seed:curation:apply
```

`admin:promote` is a dry run that confirms the target account. Use `admin:promote:apply` to promote that user to `role: "admin"`.

`cleanup:movies` is a dry run. `cleanup:movies:apply` deletes duplicate saved movie records by keeping the most recently updated record for each user, video, and category.

`seed:curation` is a dry run that searches YouTube and previews seed picks for the first curated Movieflix shelves. Use `seed:curation:apply` to save the picks. Optional flags: `-- --collections=nollywood,bollywood --limit=6`.

## Main Routes

- `GET /api/health`
- `GET /api/youtube/search?q=full%20movie`
- `GET /api/youtube/videos/:videoId`
- `GET /api/curation/:collectionId`
- `POST /api/curation` admin only
- `DELETE /api/curation/:collectionId/:videoId` admin only
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `PATCH /api/auth/reset-password/:token`
- `PATCH /api/auth/change-password`
- `GET /api/auth/user`
- `PUT /api/auth/updateUser`
- `POST /api/auth/upload`
- `POST /api/movie/save`
- `GET /api/movie/:category`
- `DELETE /api/movie/:videoId/:category`

Valid movie categories are `watchLater`, `loved`, and `watching`.

Curated collection IDs should match the frontend collection IDs, such as `nollywood`, `bollywood`, `hollywood`, or `korean`. Admin-only curation routes require a user with `role: "admin"`.

## Deployment Notes

- The Express app is exported for serverless hosts and only calls `app.listen` outside Vercel.
- Set `CLIENT_ORIGINS` to comma-separated frontend origins for production and staging. `FRONTEND_URL` and `CLIENT_URL` are still supported for single-origin deployments.
- Keep `YOUTUBE_API_KEY` on the backend. The frontend should call `/api/youtube/...` instead of Google directly.
- YouTube proxy responses are cached in memory. Tune cache duration with `YOUTUBE_CACHE_TTL_MINUTES`.
- Use `/api/health` after deployment to confirm the API is reachable, MongoDB is connected, and required integrations are configured. Health reports only booleans and allowed origins, never secret values.
