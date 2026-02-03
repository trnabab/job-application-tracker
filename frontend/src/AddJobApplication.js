import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const AddJobApplication = ({ onAdd }) => {
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [fetchStatus, setFetchStatus] = useState({ type: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ status, description, link, date, alertDate, title, company, startDate });
    // Reset form
    setStatus('');
    setDescription('');
    setLink('');
    setDate('');
    setAlertDate('');
    setTitle('');
    setCompany('');
    setStartDate('');
    setFetchStatus({ type: '', message: '' });
  };

  const handleFetchDescription = async () => {
    if (!link) return;
    
    setIsLoading(true);
    setFetchStatus({ type: 'loading', message: 'Fetching job details...' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await axios.post(`${API_URL}/fetch-job-description`, { url: link });
      const { jobDescription, jobTitle, companyName, startDate: fetchedStartDate } = response.data;
      
      let fieldsUpdated = 0;
      if (jobDescription) { setDescription(jobDescription); fieldsUpdated++; }
      if (jobTitle) { setTitle(jobTitle); fieldsUpdated++; }
      if (companyName) { setCompany(companyName); fieldsUpdated++; }
      if (fetchedStartDate) { setStartDate(fetchedStartDate); fieldsUpdated++; }
      
      if (fieldsUpdated > 0) {
        setFetchStatus({ type: 'success', message: `Successfully fetched ${fieldsUpdated} field(s)!` });
      } else {
        setFetchStatus({ type: 'error', message: 'Could not auto-fetch details. Please enter manually.' });
      }
    } catch (error) {
      console.error('Failed to fetch job description', error);
      setFetchStatus({ type: 'error', message: 'Could not auto-fetch details. Please enter manually.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add New Application</h2>
      
      <div>
        <label>Status</label>
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
        <label>Job Link</label>
        <div className="link-input-group">
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/job-posting"
            required
          />
          <button 
            type="button" 
            onClick={handleFetchDescription}
            disabled={isLoading || !link}
          >
            {isLoading ? 'Fetching...' : 'Auto-fetch'}
          </button>
        </div>
        {fetchStatus.message && (
          <div className={`fetch-status ${fetchStatus.type}`}>
            {fetchStatus.message}
          </div>
        )}
      </div>

      <div>
        <label>Job Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Software Engineer"
          required
        />
      </div>

      <div>
        <label>Company Name</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Google"
          required
        />
      </div>

      <div>
        <label>Date Applied</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Alert Date</label>
        <input
          type="date"
          value={alertDate}
          onChange={(e) => setAlertDate(e.target.value)}
          placeholder="Optional reminder date"
        />
      </div>

      <div>
        <label>Start Date</label>
        <input
          type="text"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="e.g. 1 Sep 2025"
        />
      </div>

      <div>
        <label>Job Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste or type the job description here..."
          rows={5}
        />
      </div>

      <button type="submit">Add Job Application</button>
    </form>
  );
};

export default AddJobApplication;
