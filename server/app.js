const express = require('express');
const session = require('express-session');

const oauthRoutes = require('./routes/oauth');
const accountsRoutes = require('./routes/accounts');

const PORT = process.env.PORT || 3000;
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

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
