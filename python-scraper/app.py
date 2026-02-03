from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
]

def scrape_with_beautifulsoup(url):
    """Primary scraping method using BeautifulSoup"""
    try:
        logger.info(f"Attempting BeautifulSoup scraping for: {url}")

        headers = {
            'User-Agent': USER_AGENTS[0],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract job details using common HTML patterns
        job_title = ''
        company_name = ''
        start_date = ''
        job_description = ''

        # Try to find job title (common patterns)
        title_selectors = ['h1', '.job-title', '#job-title', '[class*="title"]', '[class*="position"]']
        for selector in title_selectors:
            if not job_title:
                element = soup.select_one(selector)
                if element and element.get_text(strip=True):
                    job_title = element.get_text(strip=True)
                    break

        # Try to find company name
        company_selectors = ['h2', '.company-name', '#company-name', '[class*="company"]', '[class*="employer"]']
        for selector in company_selectors:
            if not company_name:
                element = soup.select_one(selector)
                if element and element.get_text(strip=True):
                    company_name = element.get_text(strip=True)
                    break

        # Try to find job description
        desc_selectors = [
            '.job-description', '#job-description',
            '[class*="description"]', '[class*="job-details"]',
            'article', 'main', '.content'
        ]
        for selector in desc_selectors:
            if not job_description:
                element = soup.select_one(selector)
                if element and element.get_text(strip=True):
                    job_description = element.get_text(strip=True)
                    if len(job_description) > 200:  # Only use if substantial content
                        break

        # Try to find start date (look for date-like patterns)
        date_keywords = ['start date', 'start', 'begin', 'commencement']
        for text in soup.find_all(string=True):
            text_lower = text.lower()
            for keyword in date_keywords:
                if keyword in text_lower and not start_date:
                    # Try to extract date from nearby elements
                    parent = text.parent
                    if parent:
                        start_date = parent.get_text(strip=True).replace('Start date ', '').replace('Start Date ', '')
                    break

        result = {
            'jobTitle': job_title,
            'companyName': company_name,
            'startDate': start_date,
            'jobDescription': job_description,
            'method': 'beautifulsoup'
        }

        # Check if we got meaningful data
        if job_title or company_name or (job_description and len(job_description) > 100):
            logger.info(f"BeautifulSoup successfully scraped data")
            return result
        else:
            logger.info("BeautifulSoup returned insufficient data, will try Selenium")
            return None

    except Exception as e:
        logger.error(f"BeautifulSoup scraping failed: {str(e)}")
        return None

def scrape_with_selenium(url):
    """Fallback scraping method using Selenium for dynamic sites"""
    driver = None
    try:
        logger.info(f"Attempting Selenium scraping for: {url}")

        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument(f'--user-agent={USER_AGENTS[0]}')

        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        # Scroll to load dynamic content
        driver.execute_script('window.scrollTo(0, document.body.scrollHeight)')
        time.sleep(2)
        driver.execute_script('window.scrollTo(0, 0)')
        time.sleep(2)

        # Wait for body to be present
        WebDriverWait(driver, 60).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'body'))
        )
        time.sleep(5)

        # Extract content using JavaScript
        content = driver.execute_script("""
            const jobTitle = document.querySelector('h1')?.textContent || '';
            const companyName = document.querySelector('h2')?.textContent || '';

            // Try XPath for specific sites (Hatch.team)
            let startDate = '';
            try {
                const startDateElement = document.evaluate(
                    '/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[1]/ul/li[6]/span[2]',
                    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                ).singleNodeValue;
                if (startDateElement) {
                    startDate = startDateElement.textContent.replace('Start date ', '');
                }
            } catch (e) {}

            // Try XPath for job description
            let jobDescription = '';
            try {
                const jobDescElement = document.evaluate(
                    '/html/body/div[1]/div[3]/div[3]/div/div/div[2]/div/div/section/section[2]/div',
                    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                ).singleNodeValue;
                if (jobDescElement) {
                    jobDescription = jobDescElement.innerText;
                }
            } catch (e) {}

            // Fallback: try common selectors
            if (!jobDescription) {
                const descElement = document.querySelector('.job-description, #job-description, [class*="description"]');
                if (descElement) {
                    jobDescription = descElement.innerText;
                }
            }

            return { jobTitle, companyName, startDate, jobDescription };
        """)

        result = {
            'jobTitle': content.get('jobTitle', ''),
            'companyName': content.get('companyName', ''),
            'startDate': content.get('startDate', ''),
            'jobDescription': content.get('jobDescription', ''),
            'method': 'selenium'
        }

        logger.info(f"Selenium successfully scraped data")
        return result

    except Exception as e:
        logger.error(f"Selenium scraping failed: {str(e)}")
        raise
    finally:
        if driver:
            driver.quit()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'Python Scraper Service is running!'}), 200

@app.route('/scrape', methods=['POST'])
def scrape_job():
    """
    Main scraping endpoint - tries BeautifulSoup first, falls back to Selenium
    Request body: { "url": "https://example.com/job" }
    """
    try:
        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        logger.info(f"Scraping request received for: {url}")

        # Try BeautifulSoup first (faster, more efficient)
        result = scrape_with_beautifulsoup(url)

        # If BeautifulSoup fails or returns insufficient data, use Selenium
        if not result:
            logger.info("Falling back to Selenium...")
            result = scrape_with_selenium(url)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        return jsonify({'error': f'Failed to scrape job description: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
