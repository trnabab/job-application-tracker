const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const notifier = require('node-notifier');

const jobApplicationsFile = path.join(__dirname, 'jobApplications.json');

const sendDesktopNotification = (application) => {
  notifier.notify({
    title: 'Job Application Alert',
    message: `Reminder: You have an alert for the job application at ${application.company} with status ${application.status}.`,
    sound: true,
  });
};

const checkAlerts = () => {
  fs.readFile(jobApplicationsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading job applications:', err.message, err.stack);
      return;
    }
    const jobApplications = JSON.parse(data);
    const now = new Date();
    jobApplications.forEach((application) => {
      if (application.alertDate) {
        const alertDate = new Date(application.alertDate);
        if (alertDate <= now) {
          sendDesktopNotification(application);
        }
      }
    });
  });
};

// Check alerts on startup
checkAlerts();

// Schedule to check alerts every hour
schedule.scheduleJob('0 * * * *', checkAlerts);
