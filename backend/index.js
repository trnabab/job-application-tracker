const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const app = express();
const port = 3001;
const jobApplicationsFile = 'jobApplications.json';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Application Tracker Backend is running!');
});

// Fetch job description from URL
app.post('/fetch-job-description', async (req, res) => {
  const { url } = req.body;
  console.log('Fetching job description from:', url);

  try {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-blink-features=AutomationControlled');

    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    options.addArguments(`--user-agent=${userAgent}`);

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.get(url);

    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
    await driver.sleep(2000);
    await driver.executeScript('window.scrollTo(0, 0)');
    await driver.sleep(2000);
    await driver.wait(until.elementLocated(By.css('body')), 60000);
    await driver.sleep(5000);

    const content = await driver.executeScript(() => {
      const jobTitle = document.querySelector('h1')?.textContent || '';
      const companyName = document.querySelector('h2')?.textContent || '';
      const startDateElement = document.evaluate('/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[1]/ul/li[6]/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      const startDate = startDateElement ? startDateElement.textContent.replace('Start date ', '') : '';
      const jobDescriptionElement = document.evaluate('/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[2]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      const jobDescription = jobDescriptionElement ? jobDescriptionElement.innerText : '';
      return { jobTitle, companyName, startDate, jobDescription };
    });

    await driver.quit();
    console.log('Fetched:', content);
    res.json(content);
  } catch (error) {
    console.error('Error fetching:', error.message);
    res.status(500).json({ error: 'Failed to fetch job description' });
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
