const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3001;
const jobApplicationsFile = 'jobApplications.json';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Application Tracker Backend');
});

app.post('/fetch-job-description', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL:', url); // Log the received URL
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    const $ = cheerio.load(data);
    let jobDescription = '';
    $('p').each((i, elem) => {
      jobDescription += $(elem).text() + '\n';
    });

    const jobTitle = $('h1').text();
    const companyName = $('h2').text();
    const location = $('h3').text();

    console.log('Fetched job description:', jobDescription); // Log job description
    res.json({ jobTitle, companyName, location, jobDescription });
  } catch (error) {
    console.error('Error fetching job description:', error.message, error.stack); // Log error
    res.status(500).json({ error: 'Failed to fetch job description' });
  }
});

app.get('/job-applications', (req, res) => {
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack); // Log error
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    res.json(JSON.parse(data));
  });
});

app.post('/job-applications', async (req, res) => {
  const newApplication = req.body;
  try {
    const response = await axios.post('http://localhost:3001/fetch-job-description', { url: newApplication.link });
    newApplication.description = response.data.jobDescription;
    if (!newApplication.description) {
      return res.status(500).json({ error: 'Failed to fetch job description' });
    }
    fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading job applications:', err.message, err.stack); // Log error
        return res.status(500).json({ error: 'Failed to read job applications' });
      }
      const jobApplications = JSON.parse(data);
      jobApplications.push(newApplication);
      fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
        if (err) {
          console.error('Error saving job application:', err.message, err.stack); // Log error
          return res.status(500).json({ error: 'Failed to save job application' });
        }
        console.log('Job applications:', jobApplications); // Log job applications to console
        res.status(201).json(newApplication);
      });
    });
  } catch (error) {
    console.error('Error fetching job description:', error.message, error.stack); // Log error
    res.status(500).json({ error: 'Failed to fetch job description' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  if (!fs.existsSync(jobApplicationsFile)) {
    fs.writeFileSync(jobApplicationsFile, '[]');
  }
});