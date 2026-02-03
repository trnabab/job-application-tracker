import React, { useState, useEffect } from 'react';
import './App.css';
import AddJobApplication from './AddJobApplication';
import JobApplicationList from './JobApplicationList';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function App() {
  const [applications, setApplications] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${API_URL}/job-applications`);
        console.log('Fetched applications:', response.data);
        setApplications(response.data);
      } catch (error) {
        console.error('Failed to fetch job applications', error);
      }
    };
    fetchApplications();
  }, []);

  const handleAddApplication = async (application) => {
    try {
      const response = await axios.post(`${API_URL}/job-applications`, application);
      console.log('Added application:', response.data);
      setApplications([...applications, response.data]);
      setNotification('New job application added!');
    } catch (error) {
      console.error('Failed to add job application', error);
    }
  };

  const handleUpdateStatus = async (index, newStatus) => {
    try {
      const updatedApplications = [...applications];
      updatedApplications[index].status = newStatus;
      setApplications(updatedApplications);
      await axios.put(`${API_URL}/job-applications/${index}`, updatedApplications[index]);
      setNotification('Job application status updated!');
    } catch (error) {
      console.error('Failed to update status', error);
      setNotification('Failed to update status');
    }
  };

  const handleUpdateDate = async (index, newDate) => {
    try {
      const updatedApplications = [...applications];
      updatedApplications[index].date = newDate;
      setApplications(updatedApplications);
      await axios.put(`${API_URL}/job-applications/${index}`, updatedApplications[index]);
      setNotification('Job application date updated!');
    } catch (error) {
      console.error('Failed to update date', error);
      setNotification('Failed to update date');
    }
  };

  const handleUpdateAlertDate = async (index, newAlertDate) => {
    try {
      const updatedApplications = [...applications];
      updatedApplications[index].alertDate = newAlertDate;
      setApplications(updatedApplications);
      await axios.put(`${API_URL}/job-applications/${index}`, updatedApplications[index]);
      setNotification('Job application alert date updated!');
    } catch (error) {
      console.error('Failed to update alert date', error);
      setNotification('Failed to update alert date');
    }
  };

  const handleDeleteApplication = async (index) => {
    try {
      await axios.delete(`${API_URL}/job-applications/${index}`);
      const updatedApplications = applications.filter((_, i) => i !== index);
      setApplications(updatedApplications);
      setNotification('Job application deleted!');
    } catch (error) {
      console.error('Failed to delete job application', error);
      setNotification('Failed to delete application');
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
      <JobApplicationList 
        applications={applications} 
        onUpdateStatus={handleUpdateStatus} 
        onUpdateDate={handleUpdateDate} 
        onUpdateAlertDate={handleUpdateAlertDate} 
        onDelete={handleDeleteApplication} 
      />
    </div>
  );
}

export default App;
