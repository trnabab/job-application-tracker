const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3001;
const jobApplicationsFile = 'jobApplications.json';
const PYTHON_SCRAPER_URL = 'http://localhost:5001';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Application Tracker Backend is running!');
});

// Fetch job description from URL using Python microservice
app.post('/fetch-job-description', async (req, res) => {
  const { url } = req.body;
  console.log('Fetching job description from:', url);

  try {
    // Call Python microservice for scraping
    const response = await axios.post(`${PYTHON_SCRAPER_URL}/scrape`, { url }, {
      timeout: 60000 // 60 second timeout
    });

    const content = response.data;
    console.log('Fetched:', content);
    console.log('Method used:', content.method);

    res.json(content);
  } catch (error) {
    console.error('Error fetching:', error.message);
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Python scraper service is not running on port 5001. Please start it with: cd python-scraper && python app.py'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch job description' });
    }
  }
});

// Get all applications
app.get('/job-applications', (req, res) => {
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    res.json(JSON.parse(data));
  });
});

// Add new application
app.post('/job-applications', (req, res) => {
  const newApplication = req.body;
  
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    const jobApplications = JSON.parse(data);
    newApplication.index = jobApplications.length;
    jobApplications.push(newApplication);
    
    fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save job application' });
      }
      console.log('Saved application:', newApplication);
      res.status(201).json(newApplication);
    });
  });
});

// Update application
app.put('/job-applications/:index', (req, res) => {
  const { index } = req.params;
  const updatedApplication = req.body;
  
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    let jobApplications = JSON.parse(data);
    
    if (index >= 0 && index < jobApplications.length) {
      jobApplications[index] = { ...updatedApplication, index: parseInt(index) };
      
      fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to save job application' });
        }
        console.log('Updated application:', jobApplications[index]);
        res.status(200).json(jobApplications[index]);
      });
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  });
});

// Delete application
app.delete('/job-applications/:index', (req, res) => {
  const { index } = req.params;
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    let jobApplications = JSON.parse(data);
    jobApplications = jobApplications.filter((app, i) => i != index);
    jobApplications.forEach((app, i) => app.index = i);
    
    fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save job applications' });
      }
      console.log('Deleted application at index:', index);
      res.status(200).json({ message: 'Deleted successfully' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (!fs.existsSync(jobApplicationsFile)) {
    fs.writeFileSync(jobApplicationsFile, '[]');
  }
});
