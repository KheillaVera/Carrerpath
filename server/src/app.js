const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const skillsRoutes = require('./routes/skills.routes');
const companiesRoutes = require('./routes/companies.routes');
const jobsRoutes = require('./routes/jobs.routes');
const adminRoutes = require('./routes/admin.routes');
const applicationsRoutes = require('./routes/applications.routes');
const assessmentsRoutes = require('./routes/assessments.routes');
const interviewsRoutes = require('./routes/interviews.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.disable('x-powered-by');

// Rate limiting reads the client address, so only trust a proxy when one is
// actually in front of us — trusting blindly lets a client spoof its IP.
if (env.trustProxy) app.set('trust proxy', 1);

app.use(
  helmet({
    // The API serves JSON only, so it can afford a restrictive policy.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    hsts: env.nodeEnv === 'production'
      ? { maxAge: 15552000, includeSubDomains: true }
      : false,
  })
);

// Only the configured front end may call the API from a browser.
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

// Bounded bodies — an unbounded parser is a denial-of-service waiting to happen.
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser());

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
