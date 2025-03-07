import React, { useState, useEffect } from 'react';
import './App.css';
import AddJobApplication from './AddJobApplication';
import JobApplicationList from './JobApplicationList';
import axios from 'axios';

function App() {
  const [applications, setApplications] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get('http://localhost:3001/job-applications');
        console.log('Fetched applications:', response.data); // Log fetched applications
        setApplications(response.data);
      } catch (error) {
        console.error('Failed to fetch job applications', error);
      }
    };
    fetchApplications();
  }, []);

  const handleAddApplication = async (application) => {
    try {
      const response = await axios.post('http://localhost:3001/job-applications', application);
      console.log('Added application:', response.data); // Log added application
      setApplications([...applications, response.data]);
      setNotification('New job application added!');
    } catch (error) {
      console.error('Failed to add job application', error);
    }
  };

  const handleAddLinkedInApplication = async (application) => {
    try {
      const response = await axios.post('http://localhost:3001/fetch-linkedin-job-description', { url: application.link });
      console.log('Fetched LinkedIn application:', response.data); // Log fetched LinkedIn application
      const newApplication = {
        ...application,
        description: response.data.jobDescription,
        title: response.data.jobTitle,
        company: response.data.companyName,
        startDate: response.data.startDate
      };
      setApplications([...applications, newApplication]);
      setNotification('New LinkedIn job application added!');
    } catch (error) {
      console.error('Failed to add LinkedIn job application', error);
    }
  };

  const handleUpdateStatus = (index, newStatus) => {
    const updatedApplications = [...applications];
    updatedApplications[index].status = newStatus;
    setApplications(updatedApplications);
    setNotification('Job application status updated!');
  };

  const handleUpdateDate = (index, newDate) => {
    const updatedApplications = [...applications];
    updatedApplications[index].date = newDate;
    setApplications(updatedApplications);
    setNotification('Job application date updated!');
  };

  const handleUpdateAlertDate = (index, newAlertDate) => {
    const updatedApplications = [...applications];
    updatedApplications[index].alertDate = newAlertDate;
    setApplications(updatedApplications);
    setNotification('Job application alert date updated!');
  };

  const handleUpdateApplication = async (index, updatedApplication) => {
    try {
      const response = await axios.put(`http://localhost:3001/job-applications/${index}`, updatedApplication);
      const updatedApplications = [...applications];
      updatedApplications[index] = response.data;
      setApplications(updatedApplications);
      setNotification('Job application updated!');
    } catch (error) {
      console.error('Failed to update job application', error);
    }
  };

  const handleDeleteApplication = async (index) => {
    try {
      await axios.delete(`http://localhost:3001/job-applications/${index}`);
      const updatedApplications = applications.filter((_, i) => i !== index);
      setApplications(updatedApplications);
      setNotification('Job application deleted!');
    } catch (error) {
      console.error('Failed to delete job application', error);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Job Application Tracker</h1>
      </header>
      {notification && <div className="notification">{notification}</div>}
      <AddJobApplication onAdd={handleAddApplication} />
      <JobApplicationList applications={applications} onUpdateStatus={handleUpdateStatus} onUpdateDate={handleUpdateDate} onUpdateAlertDate={handleUpdateAlertDate} onUpdateApplication={handleUpdateApplication} onDelete={handleDeleteApplication} />
    </div>
  );
}

export default App;
