import React, { useState } from 'react';
import './JobApplicationList.css';

const JobApplicationList = ({ applications, onUpdateStatus, onUpdateDate, onUpdateAlertDate, onDelete }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleStatusChange = (index, newStatus) => {
    onUpdateStatus(index, newStatus);
  };

  const handleDateChange = (index, newDate) => {
    onUpdateDate(index, newDate);
  };

  const handleAlertDateChange = (index, newAlertDate) => {
    onUpdateAlertDate(index, newAlertDate);
  };

  const toggleDescription = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div>
      <h2>Job Applications</h2>
      <table className="job-application-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Job Link</th>
            <th>Date</th>
            <th>Alert Date</th>
            <th>Job Title</th>
            <th>Company Name</th>
            <th>Start Date</th>
            <th>Job Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => (
            <tr key={index}>
              <td>
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(index, e.target.value)}
                >
                  <option value="Applied">Applied</option>
                  <option value="Assessment Pending">Assessment Pending</option>
                  <option value="Assessment Done">Assessment Done</option>
                  <option value="Stage 1">Stage 1</option>
                  <option value="Stage 2">Stage 2</option>
                  <option value="Stage 3">Stage 3</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Interview Pending">Interview Pending</option>
                </select>
              </td>
              <td><a href={app.link} target="_blank" rel="noopener noreferrer">{app.link}</a></td>
              <td>
                <input
                  type="date"
                  value={app.date}
                  onChange={(e) => handleDateChange(index, e.target.value)}
                />
              </td>
              <td>
                <input
                  type="date"
                  value={app.alertDate}
                  onChange={(e) => handleAlertDateChange(index, e.target.value)}
                />
              </td>
              <td>{app.title}</td>
              <td>{app.company}</td>
              <td>{app.startDate}</td>
              <td>
                <div className="description-container">
                  <div className={`description ${expandedIndex === index ? 'expanded' : ''}`} onClick={() => toggleDescription(index)}>
                    {app.description}
                  </div>
                </div>
              </td>
              <td><button onClick={() => onDelete(index)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobApplicationList;
