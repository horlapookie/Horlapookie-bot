import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function uploadImageToImgur(imagePath, clientId) {
  try {
    const data = new FormData();
    data.append('image', fs.createReadStream(imagePath));

    const headers = {
      'Authorization': `Client-ID ${clientId}`,
      ...data.getHeaders()
    };

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.imgur.com/3/image',
      headers: headers,
      data: data
    };

    const response = await axios(config);
    const imageUrl = response.data.data.link;
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    throw new Error('An error occurred while uploading to Imgur.');
  }
}

export { uploadImageToImgur };
import axios from 'axios';
import FormData from 'form-data';
import config from '../config.js';

export const uploadToImgur = async (buffer) => {
  try {
    const form = new FormData();
    form.append('image', buffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });

    const response = await axios.post('https://api.imgur.com/3/image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Client-ID ${config.imgurClientId || '546c25a59c58ad7'}`
      },
      timeout: 30000
    });

    if (response.data && response.data.data && response.data.data.link) {
      return response.data.data.link;
    } else {
      throw new Error('Invalid response from Imgur');
    }
  } catch (error) {
    console.error('Imgur upload failed:', error.message);
    // Fallback: return a base64 data URL
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
};
