import React, { useState } from 'react';

const JobApplicationList = ({ applications, onUpdateStatus, onUpdateDate, onUpdateAlertDate, onDelete }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const statusOrder = [
    'Applied',
    'Assessment Pending',
    'Assessment Done',
    'Stage 1',
    'Stage 2',
    'Stage 3',
    'Interview Pending',
    'Waiting',
    'Rejected'
  ];

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

  // Group applications by status
  const groupedApplications = statusOrder.reduce((groups, status) => {
    const apps = applications.filter(app => app.status === status);
    if (apps.length > 0) {
      groups[status] = apps;
    }
    return groups;
  }, {});

  if (applications.length === 0) {
    return (
      <div className="table-container">
        <h2>Your Applications</h2>
        <div className="empty-state">
          <p>No job applications yet</p>
          <span>Add your first application above to get started!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h2>Your Applications ({applications.length})</h2>
      
      {Object.entries(groupedApplications).map(([status, apps]) => (
        <div key={status} className="status-group">
          <h3 className={`status-header status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
            {status} <span className="count">({apps.length})</span>
          </h3>
          <table className="job-application-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Job Title</th>
                <th>Company</th>
                <th>Link</th>
                <th>Applied</th>
                <th>Alert</th>
                <th>Start Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const originalIndex = app.index;
                return (
                  <tr key={originalIndex}>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(originalIndex, e.target.value)}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Assessment Pending">Assessment Pending</option>
                        <option value="Assessment Done">Assessment Done</option>
                        <option value="Stage 1">Stage 1</option>
                        <option value="Stage 2">Stage 2</option>
                        <option value="Stage 3">Stage 3</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Interview Pending">Interview Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td><strong>{app.title || '—'}</strong></td>
                    <td>{app.company || '—'}</td>
                    <td>
                      <a href={app.link} target="_blank" rel="noopener noreferrer">
                        {app.link ? new URL(app.link).hostname : '—'}
                      </a>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={app.date}
                        onChange={(e) => handleDateChange(originalIndex, e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={app.alertDate || ''}
                        onChange={(e) => handleAlertDateChange(originalIndex, e.target.value)}
                      />
                    </td>
                    <td>{app.startDate || '—'}</td>
                    <td>
                      <div className="description-container">
                        <div 
                          className={`description ${expandedIndex === originalIndex ? 'expanded' : ''}`} 
                          onClick={() => toggleDescription(originalIndex)}
                          title="Click to expand"
                        >
                          {app.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => onDelete(originalIndex)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default JobApplicationList;
