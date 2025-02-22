import React, { useState } from 'react';
import axios from 'axios';

const AddJobApplication = ({ onAdd }) => {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ company, position, status, description, link });
    setCompany('');
    setPosition('');
    setStatus('');
    setDescription('');
    setLink('');
  };

  const handleFetchDescription = async () => {
    try {
      const response = await axios.post('http://localhost:3001/fetch-job-description', { url: link });
      setDescription(response.data.jobDescription);
    } catch (error) {
      console.error('Failed to fetch job description', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Company:</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Position:</label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          required
        >
          <option value="">Select Status</option>
          <option value="Applied">Applied</option>
          <option value="Assessment Pending">Assessment Pending</option>
          <option value="Assessment Done">Assessment Done</option>
          <option value="Stage 1">Stage 1</option>
          <option value="Stage 2">Stage 2</option>
          <option value="Stage 3">Stage 3</option>
          <option value="Waiting">Waiting</option>
          <option value="Interview Pending">Interview Pending</option>
        </select>
      </div>
      <div>
        <label>Job Link:</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={handleFetchDescription}
          required
        />
      </div>
      {description && (
        <div>
          <label>Job Description:</label>
          <textarea
            value={description}
            readOnly
          />
        </div>
      )}
      <button type="submit">Add Job Application</button>
    </form>
  );
};

export default AddJobApplication;
