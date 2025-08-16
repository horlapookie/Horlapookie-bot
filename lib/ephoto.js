
import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';

export const ephoto = async (url, text) => {
  try {
    console.log(`Starting ephoto with URL: ${url}, text: ${text}`);
    
    // Get the form page
    const { data: pageHtml } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(pageHtml);
    
    // Create form data
    const formData = new FormData();
    formData.append('text', text);
    formData.append('submit', 'GO');

    // Look for CSRF tokens or hidden fields
    $('input[type="hidden"]').each((i, el) => {
      const name = $(el).attr('name');
      const value = $(el).attr('value');
      if (name && value) {
        formData.append(name, value);
      }
    });

    console.log('Submitting form...');
    
    // Submit form
    const submitResponse = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': url
      },
      timeout: 60000,
      maxRedirects: 10
    });

    const $result = cheerio.load(submitResponse.data);
    
    // Multiple strategies to find the result image
    let imageUrl = null;
    
    // Strategy 1: Direct image in download area
    const downloadImg = $result('#download .download-image img').attr('src');
    if (downloadImg) {
      imageUrl = downloadImg.startsWith('http') ? downloadImg : 'https://en.ephoto360.com' + downloadImg;
    }
    
    // Strategy 2: Result image
    if (!imageUrl) {
      const resultImg = $result('.result-image img, .thumbnail img').first().attr('src');
      if (resultImg) {
        imageUrl = resultImg.startsWith('http') ? resultImg : 'https://en.ephoto360.com' + resultImg;
      }
    }
    
    // Strategy 3: Download link
    if (!imageUrl) {
      const downloadLink = $result('a[href*="download"], a[download]').first().attr('href');
      if (downloadLink) {
        imageUrl = downloadLink.startsWith('http') ? downloadLink : 'https://en.ephoto360.com' + downloadLink;
      }
    }
    
    // Strategy 4: Any image with ephoto in src
    if (!imageUrl) {
      $result('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && (src.includes('ephoto360.com') || src.includes('/image/') || src.includes('/temp/'))) {
          imageUrl = src.startsWith('http') ? src : 'https://en.ephoto360.com' + src;
          return false; // break
        }
      });
    }

    console.log(`Found image URL: ${imageUrl}`);

    if (!imageUrl) {
      throw new Error('Could not find result image in response');
    }

    // Verify image URL works
    try {
      const testResponse = await axios.head(imageUrl, { timeout: 10000 });
      if (!testResponse.headers['content-type']?.startsWith('image/')) {
        throw new Error('URL does not point to valid image');
      }
    } catch (testError) {
      console.log('Image test failed, returning URL anyway');
    }

    return imageUrl;
    
  } catch (error) {
    console.error('Ephoto error:', error.message);
    throw new Error(`Failed to generate logo: ${error.message}`);
  }
};
