const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const ProxyAgent = require('proxy-agent');
const app = express();
const port = 3001;
const jobApplicationsFile = 'jobApplications.json';

puppeteer.use(StealthPlugin());

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
  console.log('Received LinkedIn URL:', url);

  try {
    const options = new firefox.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-blink-features=AutomationControlled');

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36';
    options.addArguments(`--user-agent=${userAgent}`);

    // Set DNS to Google's DNS
    options.addArguments('--dns-prefetch-disable');
    options.addArguments('--host-resolver-rules=MAP * 8.8.8.8,MAP * 8.8.4.4');

    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
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

    // Press the button to dismiss overlay if it exists
    try {
      const dismissButton = await driver.findElement(By.xpath('/html/body/div[6]/div/div/section/button'));
      if (dismissButton) {
        await dismissButton.click();
        await driver.sleep(2000); // Wait for the overlay to close
      }
    } catch (e) {
      console.log('No overlay found or failed to close overlay:', e.message);
    }

    // Get job title
    let jobTitle = '';
    try {
      const jobTitleElement = await driver.findElement(By.xpath("//h1[contains(@class,'topcard__title')]")).getText();
      jobTitle = jobTitleElement ? jobTitleElement : '';
    } catch (e) {
      console.log('Failed to get job title:', e.message);
    }

    // Get company name
    let companyName = '';
    try {
      const companyNameElement = await driver.findElement(By.xpath("//a[contains(@class,'topcard__org-name-link')]")).getText();
      companyName = companyNameElement ? companyNameElement : '';
    } catch (e) {
      console.log('Failed to get company name:', e.message);
    }

    // Get start date
    let startDate = '';
    try {
      const startDateElement = await driver.findElement(By.xpath("//span[contains(@class,'posted-time-ago__text')]")).getText();
      startDate = startDateElement ? startDateElement.replace('Posted ', '') : '';
    } catch (e) {
      console.log('Failed to get start date:', e.message);
    }

    // Press the button to show more job description
    try {
      const showMoreButton = await driver.findElement(By.xpath("//button[contains(@aria-label,'Show more')]")).click();
      await driver.sleep(2000); // Wait for the job description to expand
    } catch (e) {
      console.log('No show more button found or failed to click:', e.message);
    }

    // Get job description
    let jobDescription = '';
    try {
      const jobDescriptionElement = await driver.findElement(By.xpath("//div[contains(@class,'show-more-less-html__markup')]")).getText();
      jobDescription = jobDescriptionElement ? jobDescriptionElement : '';
    } catch (e) {
      console.log('Failed to get job description:', e.message);
    }

    const content = {
      jobTitle,
      companyName,
      startDate,
      jobDescription
    };

    await driver.quit();
    console.log('Fetched LinkedIn job description:', content);
    res.json(content);
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
  const newApplication = req.body;
  try {
    const response = await axios.post('http://localhost:3001/fetch-job-description', { url: newApplication.link });
    const { jobDescription, jobTitle, companyName, location } = response.data;
    newApplication.description = jobDescription;
    newApplication.title = jobTitle;
    newApplication.company = companyName;
    newApplication.location = location;
    if (!newApplication.description) {
      return res.status(500).json({ error: 'Failed to fetch job description' });
    }
    fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading job applications:', err.message, err.stack); // Log error
        return res.status(500).json({ error: 'Failed to read job applications' });
      }
      const jobApplications = JSON.parse(data);
      newApplication.index = jobApplications.length; // Add index field
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  if (!fs.existsSync(jobApplicationsFile)) {
    fs.writeFileSync(jobApplicationsFile, '[]');
  }
});