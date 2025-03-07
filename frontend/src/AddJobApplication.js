import React, { useState } from 'react';
import axios from 'axios';

const AddJobApplication = ({ onAdd }) => {
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [prospleLink, setProspleLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [date, setDate] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const link = prospleLink || linkedinLink;
    onAdd({ status, description, link, date, alertDate, title, company, startDate });
    setStatus('');
    setDescription('');
    setProspleLink('');
    setLinkedinLink('');
    setDate('');
    setAlertDate('');
    setTitle('');
    setCompany('');
    setStartDate('');
  };

  const handleFetchDescription = async () => {
    const link = prospleLink || linkedinLink;
    if (!link) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await axios.post('http://localhost:3001/fetch-job-description', { url: link });
      const { jobDescription, jobTitle, companyName, startDate } = response.data;
      setDescription(jobDescription);
      setTitle(jobTitle);
      setCompany(companyName);
      setStartDate(startDate);
    } catch (error) {
      console.error('Failed to fetch job description', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label>Prosple Link:</label>
        <input
          type="url"
          value={prospleLink}
          onChange={(e) => setProspleLink(e.target.value)}
          onBlur={handleFetchDescription}
        />
      </div>
      <div>
        <label>LinkedIn Link:</label>
        <input
          type="url"
          value={linkedinLink}
          onChange={(e) => setLinkedinLink(e.target.value)}
          onBlur={handleFetchDescription}
        />
      </div>
      <div>
        <label>Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      {isLoading && <div>Fetching job description...</div>}
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
