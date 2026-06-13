require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const curationRoutes = require('./routes/curationRoutes');
const { getCacheStats } = require('./utils/cache');
const { getConfigStatus, getConfiguredOrigins } = require('./utils/configStatus');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = getConfiguredOrigins();
const isProduction = process.env.NODE_ENV === 'production';

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = origin ? String(origin).replace(/\/$/, "") : "";

  if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  if (isProduction) {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return false;
  }
};

const connectToMongoDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
};

// Middleware
app.use(cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      const corsError = new Error(`Origin not allowed by CORS: ${origin}`);
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json()); 

// Routes
app.use('/api/auth/', userRoutes);
app.use('/api/movie/', movieRoutes);
app.use('/api/youtube/', youtubeRoutes);
app.use('/api/curation/', curationRoutes);

app.get("/api/health",(req, res) => {
return res.status(200).json({
  success: true,
  message:'Movieflix API is healthy',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  cache: getCacheStats(),
  config: getConfigStatus(),
  timestamp: new Date().toISOString(),
})
})

app.get("/",(req, res) => {
return res.status(200).json({message:'Welcome ...'})
})

app.use(notFound);
app.use(errorHandler);


connectToMongoDB().then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB', err);
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
