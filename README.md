# Job Application Tracker

## Description
A web application to keep track of every job application you have applied to. You can add details about each application, track the current progress, and get notified whenever you have to do anything.

## Project Structure
```
backend/
  index.js
  package.json
  jobApplications.json
frontend/
  package.json
  public/
    favicon.ico
    index.html
    logo192.png
    logo512.png
    manifest.json
    robots.txt
  README.md
  src/
    AddJobApplication.js
    App.css
    App.js
    App.test.js
    index.css
    index.js
    JobApplicationList.css
    JobApplicationList.js
    logo.svg
    reportWebVitals.js
    setupTests.js
```

## Setup Instructions

### Backend
1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install the dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. Install the dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```

## Running the Application
- The backend server will be running on `http://localhost:3001`
- The frontend development server will be running on `http://localhost:3000`

## Fetching Job Descriptions

### LinkedIn Job Descriptions
To fetch job descriptions from LinkedIn, the backend uses Selenium with Firefox. The script simulates human-like behavior to avoid detection and uses Google's DNS for resolution.

### General Job Descriptions
For general job descriptions, the backend uses Puppeteer with the Stealth plugin to avoid detection.

## Troubleshooting

### Common Issues
- **Failed to resolve address for stun.l.google.com**: This is related to WebRTC and should not affect the functionality of fetching job descriptions.
- **Empty job details**: Ensure that the user-agent is set correctly and add delays to mimic human behavior.

### Logs
Check the backend logs for detailed error messages and troubleshooting information.