const express = require('express');
const session = require('express-session');
const { createProxyMiddleware } = require('http-proxy-middleware');

const oauthRoutes = require('./routes/oauth');
const accountsRoutes = require('./routes/accounts');

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const app = express();

app.use(
  session({
    secret: 'salesforce',
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false, // localhost
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(express.json());

app.get('/session', (req, res) => {
  res.status(200).json(req.session);
});

app.use('/oauth', oauthRoutes);
app.use('/accounts', accountsRoutes);

if (process.env.NODE_ENV === 'development') {
  app.use('/', createProxyMiddleware({
    target: FRONTEND_URL,
    ws: true, // Vite HMR
    changeOrigin: true,
  }))
} else {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
