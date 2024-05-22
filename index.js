const express = require('express');
const session = require('express-session');
const axios = require('axios');

// Conditionally load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 3000;

const clientId = process.env.TODOIST_CLIENT_ID;
const clientSecret = process.env.TODOIST_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI || `http://localhost:${port}/callback`;

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.get('/login', (req, res) => {
  try {
    const authUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read&state=randomstring&redirect_uri=${redirectUri}`;
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post('https://todoist.com/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    const { access_token } = tokenResponse.data;
    req.session.access_token = access_token;

    res.redirect('/random-task');
  } catch (error) {
    console.error('Error in /callback:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/random-task', async (req, res) => {
  const accessToken = req.session.access_token;

  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    const response = await axios.get('https://api.todoist.com/rest/v1/tasks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tasks = response.data;
    if (tasks.length === 0) {
      return res.send('No tasks found.');
    }
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    res.json(randomTask);
  } catch (error) {
    console.error('Error in /random-task:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  try {
    res.send('<a href="/login">Login with Todoist</a>');
  } catch (error) {
    console.error('Error in /:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
