# Python Web Scraper Microservice

A Flask-based microservice for scraping job postings using **BeautifulSoup** (primary) with **Selenium** as fallback for dynamic content.

## Architecture

This microservice integrates with the Node.js backend:

```
Frontend (React)
    ↓
Node.js Backend (Express)
    ↓
Python Scraper Microservice (Flask)
    ├── BeautifulSoup (Primary - Fast & Lightweight)
    └── Selenium (Fallback - For Dynamic Sites)
```

## Features

- **Smart Scraping**: Tries BeautifulSoup first for speed, falls back to Selenium for dynamic sites
- **Automatic Detection**: Identifies common job posting patterns
- **Anti-Bot Measures**: Random user agents and browser fingerprint masking
- **Flexible Extraction**: Works with multiple job board formats

## Installation

### 1. Install Python Dependencies

```bash
cd python-scraper
pip install -r requirements.txt
```

Or with a virtual environment (recommended):

```bash
cd python-scraper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Chrome/Chromium

Selenium requires Chrome/Chromium browser and ChromeDriver:

**macOS:**
```bash
brew install chromedriver
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver
```

**Windows:**
Download ChromeDriver from: https://chromedriver.chromium.org/

## Running the Service

### Start the Python Scraper

```bash
cd python-scraper
python app.py
```

The service will start on `http://localhost:5001`

### Start the Node.js Backend (separate terminal)

```bash
cd backend
npm start
```

### Start the Frontend (separate terminal)

```bash
cd frontend
npm start
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5001/
```

Response:
```json
{
  "status": "Python Scraper Service is running!"
}
```

### Scrape Job Posting
```bash
POST http://localhost:5001/scrape
Content-Type: application/json

{
  "url": "https://example.com/job-posting"
}
```

Response:
```json
{
  "jobTitle": "Software Engineer",
  "companyName": "Tech Company",
  "startDate": "1 Mar 2026",
  "jobDescription": "Full job description text...",
  "method": "beautifulsoup"
}
```

The `method` field indicates which scraping method was used:
- `"beautifulsoup"` - Fast static HTML parsing
- `"selenium"` - Dynamic content rendering (slower but more reliable)

## How It Works

### BeautifulSoup (Primary Method)

1. Sends HTTP request with browser-like headers
2. Parses HTML with BeautifulSoup
3. Searches for job details using common CSS selectors:
   - Job Title: `h1`, `.job-title`, `#job-title`
   - Company: `h2`, `.company-name`, `#company-name`
   - Description: `.job-description`, `article`, `main`
4. Returns data if sufficient information found

### Selenium (Fallback)

Activated when BeautifulSoup returns insufficient data:
1. Launches headless Chrome browser
2. Loads the page and waits for JavaScript to render
3. Scrolls to trigger lazy-loaded content
4. Extracts content using JavaScript
5. Supports XPath selectors for specific platforms

## Testing

Test the scraper directly:

```bash
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.hatch.team/job/example"}'
```

## Troubleshooting

### "Python scraper service is not running"
- Make sure you started the Python service: `python app.py`
- Check if port 5000 is available

### Selenium Errors
- Ensure ChromeDriver is installed and in PATH
- Update ChromeDriver to match your Chrome version
- Check Chrome is installed: `google-chrome --version`

### BeautifulSoup Returns Empty Data
- The site may use JavaScript rendering (Selenium will auto-activate)
- Some sites block scraping - check robots.txt

### CORS Errors
- CORS is enabled by default in this service
- Ensure the Node.js backend is calling from `localhost`

## Dependencies

- **Flask** - Web framework
- **flask-cors** - Cross-origin resource sharing
- **requests** - HTTP library
- **beautifulsoup4** - HTML parsing
- **selenium** - Browser automation
- **lxml** - XML/HTML parser (faster than built-in)

## Development

To modify scraping patterns, edit [app.py](app.py:30):

```python
# Add more selectors
title_selectors = ['h1', '.job-title', '#job-title', '[class*="title"]']
```

## Production Deployment

For production, use a production WSGI server:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Or with Docker (create a Dockerfile):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```
