import React from 'react';

const JobApplicationList = ({ applications, onUpdateStatus, onDelete }) => {
  const handleStatusChange = (index, newStatus) => {
    onUpdateStatus(index, newStatus);
  };

  return (
    <div>
      <h2>Job Applications</h2>
      <ul>
        {applications.map((app, index) => (
          <li key={index}>
            <h3>{app.company}</h3>
            <p>Position: {app.position}</p>
            <p>
              Status: 
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
            </p>
            <p>Job Description: {app.description}</p>
            <p>Job Link: <a href={app.link} target="_blank" rel="noopener noreferrer">{app.link}</a></p>
            <button onClick={() => onDelete(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JobApplicationList;
