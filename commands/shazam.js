import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import pkg from '@ffmpeg-installer/ffmpeg';
const { ffmpeg } = pkg;
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'shazam',
  aliases: ['identify', 'song', 'whatmusic'],
  description: '🎵 Identify song from audio - reply to voice/video message',
  usage: 'shazam (reply to audio/video)',
  category: 'tools',
  cooldown: 10,

  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
      return await sock.sendMessage(from, {
        text: '❌ Please reply to an audio message, voice note, or video to identify the song!\n\n📝 **How to use:** Reply to audio/video message + .shazam'
      });
    }

    const messageType = Object.keys(quotedMsg)[0];
    if (!['audioMessage', 'videoMessage', 'documentMessage'].includes(messageType)) {
      return await sock.sendMessage(from, { text: '❌ Please reply to an audio message, voice note, or video file!' });
    }

    const processingMsg = await sock.sendMessage(from, {
      text: '🎵 Analyzing audio... Please wait! 🔍'
    });

    try {
      // Download media
      let media;
      const mediaMessage = quotedMsg[messageType];
      if (messageType === 'audioMessage' || messageType === 'videoMessage') {
        const stream = await downloadContentFromMessage(mediaMessage, messageType.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        media = buffer;
      } else if (messageType === 'documentMessage') {
        const doc = quotedMsg.documentMessage;
        if (doc.mimetype && (doc.mimetype.includes('audio') || doc.mimetype.includes('video'))) {
          const stream = await downloadContentFromMessage(doc, 'document');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
          media = buffer;
        } else throw new Error('Unsupported file type');
      }

      if (!media || media.length === 0) throw new Error('Failed to download media');

      // Convert to MP3 with better error handling
      const tmpInput = path.join(tmpdir(), `input-${Date.now()}.tmp`);
      const tmpOutput = path.join(tmpdir(), `output-${Date.now()}.mp3`);

      try {
        fs.writeFileSync(tmpInput, media);
      } catch (err) {
        throw new Error(`Failed to write temporary file: ${err.message}`);
      }

      await new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg(tmpInput);

        // Set ffmpeg path if available
        if (ffmpegStatic) {
          ffmpegCommand.setFfmpegPath(ffmpegStatic);
        }

        ffmpegCommand
          .toFormat('mp3')
          .audioBitrate(128)
          .audioFrequency(44100)
          .audioChannels(2)
          .duration(30) // Limit to 30 seconds for better processing
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(new Error(`Audio conversion failed: ${err.message}`));
          })
          .on('end', () => {
            console.log('Audio conversion completed');
            resolve();
          })
          .save(tmpOutput);
      });

      if (!fs.existsSync(tmpOutput)) {
        throw new Error('Audio conversion failed - output file not created');
      }

      const mp3Buffer = fs.readFileSync(tmpOutput);

      if (mp3Buffer.length === 0) {
        throw new Error('Converted audio file is empty');
      }

      // Use a more reliable API - Shazam's rapid API
      const shazamApiKey = "YOUR_RAPIDAPI_KEY"; // This should be replaced with a valid key

      // Updated AudD API key
      const auddApiKey = "054b6074fabedb047a3707572e08d5c7";

      let result;

      // Try Shazam API first (if key is valid)
      if (shazamApiKey && shazamApiKey !== "YOUR_RAPIDAPI_KEY") {
        try {
          const shazamFormData = new FormData();
          shazamFormData.append('upload_file', mp3Buffer, 'audio.mp3');

          const shazamResponse = await axios.post('https://shazam-song-recognizer.p.rapidapi.com/recognize/file', shazamFormData, {
            headers: {
              ...shazamFormData.getHeaders(),
              'X-RapidAPI-Key': shazamApiKey,
              'X-RapidAPI-Host': 'shazam-song-recognizer.p.rapidapi.com'
            },
            timeout: 30000
          });

          if (shazamResponse.data && shazamResponse.data.track) {
            result = { status: 'success', result: shazamResponse.data.track, source: 'shazam' };
          }
        } catch (shazamError) {
          console.log('Shazam API failed, falling back to AudD:', shazamError.message);
        }
      }

      // Fallback to AudD API
      if (!result) {
        const formData = new FormData();
        formData.append('api_token', auddApiKey);
        formData.append('file', mp3Buffer, 'audio.mp3');
        formData.append('return', 'apple_music,spotify');

        const response = await axios.post('https://api.audd.io/', formData, { 
          headers: formData.getHeaders(), 
          timeout: 30000 
        });
        result = response.data;
        result.source = 'audd';
      }

      // Cleanup temp files
      try {
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }

      try { await sock.sendMessage(from, { delete: processingMsg.key }); } catch {}

      if (result.status === 'success' && result.result) {
        const track = result.result;

        // Handle different API response formats
        let title = track.title || track.name || 'Unknown';
        let artist = track.artist || track.subtitle || 'Unknown Artist';
        let album = track.album || 'Unknown';
        let releaseDate = track.release_date || track.sections?.[0]?.metadata?.[0]?.text || 'Unknown';

        // Get URLs based on API source
        let appleUrl = '';
        let spotifyUrl = '';
        let imageUrl = 'https://picsum.photos/300/300?random=music';

        if (result.source === 'shazam') {
          // Handle Shazam API response format
          appleUrl = track.hub?.actions?.find(action => action.name === 'apple')?.uri || '';
          spotifyUrl = track.hub?.actions?.find(action => action.name === 'spotify')?.uri || '';
          imageUrl = track.images?.coverart || track.images?.background || imageUrl;
        } else {
          // Handle AudD API response format
          appleUrl = track.apple_music?.url || '';
          spotifyUrl = track.spotify?.external_urls?.spotify || '';
          imageUrl = track.spotify?.album?.images?.[0]?.url || imageUrl;
        }

        let songInfo = `🎵 **Song Identified!**\n\n🎤 **Title:** ${title}\n👨‍Racing **Artist:** ${artist}\n💿 **Album:** ${album}\n📅 **Release Date:** ${releaseDate}`;

        if (appleUrl) songInfo += `\n🍎 Apple Music: ${appleUrl}`;
        if (spotifyUrl) songInfo += `\n🟢 Spotify: ${spotifyUrl}`;

        await sock.sendMessage(from, {
          image: { url: imageUrl },
          caption: songInfo,
          contextInfo: {
            externalAdReply: {
              title: title,
              body: `by ${artist}`,
              thumbnailUrl: imageUrl,
              sourceUrl: appleUrl || spotifyUrl || 'https://github.com',
              mediaType: 1
            }
          }
        });
      } else {
        // Provide more detailed error message
        let errorMsg = '❌ **Song Not Found**\n💡 Try with a clearer or longer audio clip!';

        if (result.error) {
          console.error('API Error:', result.error);
          if (result.error.error_message) {
            errorMsg += `\n\n🔍 **Details:** ${result.error.error_message}`;
          }
        }

        await sock.sendMessage(from, { text: errorMsg });
      }

    } catch (error) {
      console.error('Shazam error:', error);
      try { await sock.sendMessage(from, { delete: processingMsg.key }); } catch {}

      let errorMessage = '❌ **Error Identifying Song**\n';

      if (error.message.includes('Audio conversion failed')) {
        errorMessage += '💡 **Issue:** Could not process the audio file.\n🔧 **Solution:** Try sending a different audio format or check if the file is corrupted.';
      } else if (error.message.includes('Failed to download media')) {
        errorMessage += '💡 **Issue:** Could not download the audio file.\n🔧 **Solution:** Try sending the audio again or check your connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage += '💡 **Issue:** Request timed out.\n🔧 **Solution:** Try with a shorter audio clip or try again later.';
      } else if (error.message.includes('ENOENT') || error.message.includes('ffmpeg')) {
        errorMessage += '💡 **Issue:** Audio processing tool not available.\n🔧 **Solution:** The FFmpeg tool is required for audio processing. Please try with a different audio format or contact admin.';
      } else {
        errorMessage += `💡 **Details:** ${error.message}`;
      }

      await sock.sendMessage(from, { text: errorMessage });
    }
  }
};