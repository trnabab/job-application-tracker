const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const ProxyAgent = require('proxy-agent');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const app = express();
const port = 3001;
const jobApplicationsFile = 'jobApplications.json';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
];

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Application Tracker Backend');
});

app.post('/fetch-job-description', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL:', url);

  try {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-blink-features=AutomationControlled');

    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    options.addArguments(`--user-agent=${userAgent}`);

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.get(url);

    // Simulate human-like behavior
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
    await driver.sleep(2000);
    await driver.executeScript('window.scrollTo(0, 0)');
    await driver.sleep(2000);

    // Wait for the body to be loaded
    await driver.wait(until.elementLocated(By.css('body')), 60000);

    // Wait additional 5 seconds to allow content to load
    await driver.sleep(5000);

    const content = await driver.executeScript(() => {
      const jobTitle = document.querySelector('h1')?.textContent || '';
      const companyName = document.querySelector('h2')?.textContent || '';
      const startDateElement = document.evaluate('/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[1]/ul/li[6]/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      const startDate = startDateElement ? startDateElement.textContent.replace('Start date ', '') : '';
      const jobDescriptionElement = document.evaluate('/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[2]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      const jobDescription = jobDescriptionElement ? jobDescriptionElement.innerText : '';
      return {
        jobTitle,
        companyName,
        startDate,
        jobDescription
      };
    });

    await driver.quit();
    console.log('Fetched job description:', content);
    res.json(content);
  } catch (error) {
    console.error('Error fetching job description:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch job description', details: error.message });
  }
});

app.post('/fetch-linkedin-job-description', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await axios.post('http://localhost:3001/fetch-job-description', { url });
    const { jobDescription, jobTitle, companyName, location } = response.data;
    const newApplication = {
      description: jobDescription,
      title: jobTitle,
      company: companyName,
      location,
      link: url,
      index: null // Placeholder for index
    };
    fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading job applications:', err.message, err.stack);
        return res.status(500).json({ error: 'Failed to read job applications' });
      }
      const jobApplications = JSON.parse(data);
      newApplication.index = jobApplications.length;
      jobApplications.push(newApplication);
      fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
        if (err) {
          console.error('Error saving job application:', err.message, err.stack);
          return res.status(500).json({ error: 'Failed to save job application' });
        }
        console.log('Job applications:', jobApplications);
        res.status(201).json(newApplication);
      });
    });
  } catch (error) {
    console.error('Error fetching LinkedIn job description:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch LinkedIn job description', details: error.message });
  }
});

app.get('/job-applications', (req, res) => {
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack); // Log error
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    console.log('Job applications data:', data); // Log job applications data
    res.json(JSON.parse(data));
  });
});

app.post('/job-applications', async (req, res) => {
  console.log('POST /job-applications endpoint hit'); // Log endpoint hit
  const newApplication = req.body;
  console.log('Received new application:', newApplication); // Log received application
  try {
    console.log('Fetching job description for URL:', newApplication.link); // Log URL
    const response = await axios.post('http://localhost:3001/fetch-job-description', { url: newApplication.link });
    console.log('Fetched job description response:', response.data); // Log fetched job description response
    const { jobDescription, jobTitle, companyName, location } = response.data;
    newApplication.description = jobDescription;
    newApplication.title = jobTitle;
    newApplication.company = companyName;
    newApplication.location = location;
    if (!newApplication.description) {
      console.log('No job description found'); // Log missing job description
      return res.status(500).json({ error: 'Failed to fetch job description' });
    }
    console.log('Reading job applications file'); // Log file read
    fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading job applications:', err.message, err.stack); // Log error
        return res.status(500).json({ error: 'Failed to read job applications' });
      }
      console.log('Read job applications data:', data); // Log read job applications data
      const jobApplications = JSON.parse(data);
      newApplication.index = jobApplications.length; // Add index field
      jobApplications.push(newApplication);
      console.log('Writing updated job applications to file'); // Log file write
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

app.put('/job-applications/:index', (req, res) => {
  const { index } = req.params;
  const updatedApplication = req.body;
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack);
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    const jobApplications = JSON.parse(data);
    if (index < 0 || index >= jobApplications.length) {
      return res.status(404).json({ error: 'Job application not found' });
    }
    jobApplications[index] = { ...jobApplications[index], ...updatedApplication };
    fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
      if (err) {
        console.error('Error saving job applications:', err.message, err.stack);
        return res.status(500).json({ error: 'Failed to save job applications' });
      }
      res.status(200).json(jobApplications[index]);
    });
  });
});

app.delete('/job-applications/:index', (req, res) => {
  const { index } = req.params;
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack); // Log error
      return res.status(500).json({ error: 'Failed to read job applications' });
    }
    let jobApplications = JSON.parse(data);
    jobApplications = jobApplications.filter((app, i) => i != index);
    jobApplications.forEach((app, i) => app.index = i); // Update index field
    fs.writeFile(jobApplicationsFile, JSON.stringify(jobApplications, null, 2), (err) => {
      if (err) {
        console.error('Error saving job applications:', err.message, err.stack); // Log error
        return res.status(500).json({ error: 'Failed to save job applications' });
      }
      console.log('Job applications:', jobApplications); // Log job applications to console
      res.status(200).json({ message: 'Job application deleted successfully' });
    });
  });
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

const sendAlertNotification = (application) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient-email@gmail.com',
    subject: 'Job Application Alert',
    text: `Reminder: You have an alert for the job application at ${application.company} with status ${application.status}.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

const scheduleAlerts = () => {
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack);
      return;
    }
    const jobApplications = JSON.parse(data);
    jobApplications.forEach((application) => {
      if (application.alertDate) {
        const alertDate = new Date(application.alertDate);
        schedule.scheduleJob(alertDate, () => {
          sendAlertNotification(application);
        });
      }
    });
  });
};

scheduleAlerts();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log server startup
  if (!fs.existsSync(jobApplicationsFile)) {
    fs.writeFileSync(jobApplicationsFile, '[]');
  }
  scheduleAlerts();
});