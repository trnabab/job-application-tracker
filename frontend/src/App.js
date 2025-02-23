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

  const handleDeleteApplication = (index) => {
    const updatedApplications = applications.filter((_, i) => i !== index);
    setApplications(updatedApplications);
    setNotification('Job application deleted!');
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
      <JobApplicationList applications={applications} onUpdateStatus={handleUpdateStatus} onUpdateDate={handleUpdateDate} onUpdateAlertDate={handleUpdateAlertDate} onDelete={handleDeleteApplication} />
    </div>
  );
}

export default App;
