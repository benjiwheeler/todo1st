// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });

// index.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 3000;

const clientId = process.env.TODOIST_CLIENT_ID;
const clientSecret = process.env.TODOIST_CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/callback';

// Step 1: Redirect user to Todoist's OAuth page
app.get('/login', (req, res) => {
  const authUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read&state=randomstring&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
});

// Step 2: Handle the OAuth callback
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
    req.session.access_token = access_token; // Store the token in the session

    res.redirect('/random-task');
  } catch (error) {
    console.error('Error getting access token:', error);
    res.send('Error during authentication');
  }
});

// Step 3: Fetch a random task
app.get('/random-task', async (req, res) => {
  const accessToken = req.session.access_token;

  try {
    const response = await axios.get('https://api.todoist.com/rest/v1/tasks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tasks = response.data;
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    res.json(randomTask);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.send('Error fetching tasks');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
