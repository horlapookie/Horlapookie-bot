
import axios from 'axios';
import crypto from 'crypto';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import ytdl from '@distube/ytdl-core';
import { fileURLToPath } from 'url';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

let ytdlp;
try {
    const ytdlpModule = await import('yt-dlp-exec');
    ytdlp = ytdlpModule.default;
} catch (_) {
    ytdlp = null;
}

// Enhanced error logging for network issues
function logNetworkError(prefix, error) {
    try {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;
        const url = error?.config?.url;
        const method = error?.config?.method;
        const headers = error?.response?.headers;
        const dataPreview = (() => {
            if (!error?.response?.data) return undefined;
            if (Buffer.isBuffer(error.response.data)) return `<buffer ${error.response.data.length} bytes>`;
            const str = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
            return str.slice(0, 500);
        })();
        console.error(`[${prefix}] NetworkError:`, {
            message: error?.message,
            code: error?.code,
            url,
            method,
            status,
            statusText,
            headers,
            dataPreview
        });
    } catch (e) {
        console.error(`[${prefix}] Failed to log network error`, e);
    }
}

// Music API client
const musicApi = {
    base: 'https://api.princetechn.com/api/download/ytmp3',
    apikey: process.env.PRINCE_API_KEY || 'prince',
    async getMusicData(videoUrl) {
        const params = new URLSearchParams({ apikey: this.apikey, url: videoUrl });
        const url = `${this.base}?${params.toString()}`;
        
        const { data } = await axios.get(url, {
            timeout: 20000,
            headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' }
        });
        return data;
    }
};

const musicDownloader = {
    api: {
        base: "https://media.savetube.me/api",
        cdn: "/random-cdn",
        info: "/v2/info",
        download: "/download"
    },
    headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'origin': 'https://yt.savetube.me',
        'referer': 'https://yt.savetube.me/',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    formats: ['144', '240', '360', '480', '720', '1080', 'mp3'],
    crypto: {
        hexToBuffer: (hexString) => {
            const matches = hexString.match(/.{1,2}/g);
            return Buffer.from(matches.join(''), 'hex');
        },
        decrypt: async (enc) => {
            try {
                const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
                const data = Buffer.from(enc, 'base64');
                const iv = data.slice(0, 16);
                const content = data.slice(16);
                const key = musicDownloader.crypto.hexToBuffer(secretKey);
                const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
                let decrypted = decipher.update(content);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                return JSON.parse(decrypted.toString());
            } catch (error) {
                throw new Error(error);
            }
        }
    },
    extractVideoId: url => {
        if (!url) return null;
        const patterns = [
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            /youtu\.be\/([a-zA-Z0-9_-]{11})/
        ];
        for (let pattern of patterns) {
            if (pattern.test(url)) return url.match(pattern)[1];
        }
        return null;
    },
    makeRequest: async (endpoint, data = {}, method = 'post') => {
        try {
            const { data: response } = await axios({
                method,
                url: `${endpoint.startsWith('http') ? '' : musicDownloader.api.base}${endpoint}`,
                data: method === 'post' ? data : undefined,
                params: method === 'get' ? data : undefined,
                headers: musicDownloader.headers,
                timeout: 20000,
                maxRedirects: 3,
            });
            return {
                status: true,
                code: 200,
                data: response
            };
        } catch (error) {
            logNetworkError('MUSIC_DOWNLOADER.makeRequest', error);
            throw error;
        }
    },
    getCDNHost: async () => {
        console.log(`[MUSIC_DOWNLOADER] Fetching CDN host...`);
        const response = await musicDownloader.makeRequest(musicDownloader.api.cdn, {}, 'get');
        if (!response.status) throw new Error(response);
        return {
            status: true,
            code: 200,
            data: response.data.cdn
        };
    },
    downloadMusic: async (link, format) => {
        console.log(`[MUSIC_DOWNLOADER] Starting download for: ${link}, format: ${format}`);
        
        if (!link) {
            console.log(`[MUSIC_DOWNLOADER] No link provided`);
            return {
                status: false,
                code: 400,
                error: "No link provided. Please provide a valid YouTube link."
            };
        }
        if (!format || !musicDownloader.formats.includes(format)) {
            console.log(`[MUSIC_DOWNLOADER] Invalid format: ${format}`);
            return {
                status: false,
                code: 400,
                error: "Invalid format. Please choose one of the available formats: 144, 240, 360, 480, 720, 1080, mp3.",
                available_fmt: musicDownloader.formats
            };
        }
        const id = musicDownloader.extractVideoId(link);
        console.log(`[MUSIC_DOWNLOADER] Extracted YouTube ID: ${id}`);
        
        if (!id) {
            console.log(`[MUSIC_DOWNLOADER] Invalid YouTube link - no ID extracted`);
            throw new Error('Invalid YouTube link.');
        }
        
        try {
            console.log(`[MUSIC_DOWNLOADER] Getting CDN...`);
            const cdnResult = await musicDownloader.getCDNHost();
            if (!cdnResult.status) {
                console.log(`[MUSIC_DOWNLOADER] CDN request failed:`, cdnResult);
                return cdnResult;
            }
            const cdn = cdnResult.data;
            console.log(`[MUSIC_DOWNLOADER] Got CDN: ${cdn}`);
            
            console.log(`[MUSIC_DOWNLOADER] Requesting video info...`);
            const result = await musicDownloader.makeRequest(`https://${cdn}${musicDownloader.api.info}`, {
                url: `https://www.youtube.com/watch?v=${id}`
            });
            if (!result.status) {
                console.log(`[MUSIC_DOWNLOADER] Info request failed:`, result);
                return result;
            }
            console.log(`[MUSIC_DOWNLOADER] Got video info, attempting decryption...`);
            
            const decrypted = await musicDownloader.crypto.decrypt(result.data.data);
            console.log(`[MUSIC_DOWNLOADER] Decryption successful, title: ${decrypted.title}`);
            
            let downloadLink;
            try {
                console.log(`[MUSIC_DOWNLOADER] Requesting download link...`);
                downloadLink = await musicDownloader.makeRequest(`https://${cdn}${musicDownloader.api.download}`, {
                    id: id,
                    downloadType: format === 'mp3' ? 'audio' : 'video',
                    quality: format === 'mp3' ? '128' : format,
                    key: decrypted.key
                });
                console.log(`[MUSIC_DOWNLOADER] Download request successful`);
            } catch (error) {
                logNetworkError('MUSIC_DOWNLOADER.downloadLink', error);
                throw new Error('Failed to get download link. Please try again later.');
            }
            
            console.log(`[MUSIC_DOWNLOADER] Download URL: ${downloadLink.data.data.downloadUrl}`);
            
            return {
                status: true,
                code: 200,
                result: {
                    title: decrypted.title || "Unknown Title",
                    type: format === 'mp3' ? 'audio' : 'video',
                    format: format,
                    thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
                    download: downloadLink.data.data.downloadUrl,
                    id: id,
                    key: decrypted.key,
                    duration: decrypted.duration,
                    quality: format === 'mp3' ? '128' : format,
                    downloaded: downloadLink.data.data.downloaded
                }
            };
        } catch (error) {
            console.error(`[MUSIC_DOWNLOADER] Error in download function:`, error);
            throw new Error('An error occurred while processing your request. Please try again later.');
        }
    }
};

// Alternative music source via public YouTube proxy instances
const alternativeSource = {
    instances: [
        'https://piped.video',
        'https://piped.lunar.icu',
        'https://piped.projectsegfau.lt',
        'https://piped.privacy.com.de',
        'https://piped.privacydev.net',
        'https://watch.leptons.xyz',
        'https://piped.us.projectsegfau.lt',
        'https://piped.seitan-ayoub.lol',
        'https://piped.smnz.de',
        'https://piped.syncpundit.io',
        'https://piped.tokhmi.xyz'
    ],
    getAudioStreams: async (videoId) => {
        for (const base of alternativeSource.instances) {
            try {
                console.log(`[ALT_SOURCE] Trying instance: ${base}`);
                const { data } = await axios.get(`${base}/api/v1/streams/${videoId}`, {
                    headers: { 'user-agent': 'Mozilla/5.0', 'accept': 'application/json' },
                    timeout: 15000
                });
                if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
                    console.log(`[ALT_SOURCE] Found ${data.audioStreams.length} audio streams on ${base}`);
                    return { ok: true, base, streams: data.audioStreams };
                }
                console.warn(`[ALT_SOURCE] No audioStreams on ${base}`);
            } catch (e) {
                console.warn(`[ALT_SOURCE] Instance failed: ${base} -> ${e?.message || e}`);
            }
        }
        return { ok: false };
    }
};

export default {
    name: 'audio',
    description: 'Download and send audio from YouTube as direct audio',
    aliases: ['aud', 'mp3', 'yta'],
    category: 'Media',
    async execute(msg, { sock, args, settings }) {
        const chatId = msg.key.remoteJid;
        const start = Date.now();

        try {
            // React with processing emoji
            await sock.sendMessage(chatId, {
                react: { text: emojis.processing, key: msg.key }
            });

            const searchQuery = args.join(' ').trim();
            
            if (!searchQuery) {
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} *Audio Player*\n\nWhat song would you like to download?\n\nExample: \`?audio Shape of You\``,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Determine if input is a YouTube link or search query
            let videoUrl = '';
            let songTitle = '';
            
            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
            } else {
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No songs found for your search query!`,
                        react: { text: emojis.error, key: msg.key }
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                songTitle = videos[0].title || searchQuery;
            }

            // Send preview with thumbnail
            try {
                const ytId = (musicDownloader.extractVideoId(videoUrl) || '').trim();
                const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;
                const displayTitle = songTitle || searchQuery || 'Song';
                
                if (thumbUrl) {
                    await sock.sendMessage(chatId, {
                        image: { url: thumbUrl },
                        caption: `${emojis.music} *${displayTitle}*\n\n${emojis.processing} Processing your audio request...`
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error('[AUDIO] Error sending preview:', e?.message || e);
            }

            // Primary: Music API
            let musicResult;
            try {
                const musicData = await musicApi.getMusicData(videoUrl);
                if (musicData?.success && musicData?.result?.download_url) {
                    musicResult = {
                        status: true,
                        code: 200,
                        result: {
                            title: musicData.result.title,
                            type: 'audio',
                            format: 'm4a',
                            thumbnail: musicData.result.thumbnail,
                            download: musicData.result.download_url,
                            id: musicData.result.id,
                            quality: musicData.result.quality
                        }
                    };
                } else {
                    throw new Error('Music API did not return a download_url');
                }
            } catch (err) {
                console.error(`[AUDIO] Music API failed:`);
                if (err?.isAxiosError) logNetworkError('AUDIO.musicApi', err); else console.error(err);
                
                // Fallback to ytdl-core
                try {
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFile = path.join(tempDir, `${Date.now()}.mp3`);

                    const ytHeaders = {
                        'cookie': 'VISITOR_INFO1_LIVE=; PREF=f1=50000000&tz=UTC; YSC=',
                        'user-agent': 'Mozilla/5.0'
                    };
                    const info = await ytdl.getInfo(videoUrl, { requestOptions: { headers: ytHeaders } });
                    await new Promise(async (resolve, reject) => {
                        const ffmpeg = (await import('fluent-ffmpeg')).default;
                        const stream = ytdl(videoUrl, {
                            quality: 'highestaudio',
                            filter: 'audioonly',
                            highWaterMark: 1 << 25,
                            requestOptions: { headers: ytHeaders }
                        });
                        stream.on('error', (e) => {
                            console.error('[AUDIO] ytdl stream error:', e?.message || e);
                        });
                        ffmpeg(stream)
                            .audioBitrate(128)
                            .toFormat('mp3')
                            .save(tempFile)
                            .on('end', resolve)
                            .on('error', (e) => {
                                console.error('[AUDIO] ffmpeg error:', e?.message || e);
                                reject(e);
                            });
                    });

                    const elapsed = Date.now() - start;
                    await sock.sendMessage(chatId, {
                        audio: { url: tempFile },
                        mimetype: "audio/mpeg",
                        contextInfo: {
                            externalAdReply: {
                                title: info?.videoDetails?.title || 'Unknown',
                                body: `Audio by HORLA POOKIE Bot`,
                                thumbnailUrl: `https://i.ytimg.com/vi/${musicDownloader.extractVideoId(videoUrl)}/maxresdefault.jpg`,
                                sourceUrl: videoUrl,
                                mediaType: 2,
                                mediaUrl: videoUrl
                            }
                        }
                    }, { quoted: msg });

                    setTimeout(() => {
                        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                    }, 2000);

                    return;
                } catch (fbErr) {
                    console.error('[AUDIO] ytdl-core fallback failed:', fbErr?.message || fbErr);
                    
                    // Next fallback: yt-dlp
                    try {
                        if (!ytdlp) throw new Error('yt-dlp-exec not installed');
                        const tempDir = path.join(__dirname, '../temp');
                        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                        const outBase = path.join(tempDir, `${Date.now()}`);
                        const output = `${outBase}.%(ext)s`;

                        await ytdlp(videoUrl, {
                            output,
                            extractAudio: true,
                            audioFormat: 'mp3',
                            audioQuality: '0',
                            noProgress: true,
                            noPart: true,
                            addHeader: [
                                'user-agent: Mozilla/5.0',
                                'referer: https://www.youtube.com/'
                            ]
                        });

                        const outFile = `${outBase}.mp3`;
                        
                        const elapsed = Date.now() - start;
                        await sock.sendMessage(chatId, {
                            audio: { url: outFile },
                            mimetype: 'audio/mpeg',
                            contextInfo: {
                                externalAdReply: {
                                    title: searchQuery || 'song',
                                    body: `Audio by HORLA POOKIE Bot`,
                                    thumbnailUrl: `https://i.ytimg.com/vi/${musicDownloader.extractVideoId(videoUrl)}/maxresdefault.jpg`,
                                    sourceUrl: videoUrl,
                                    mediaType: 2,
                                    mediaUrl: videoUrl
                                }
                            }
                        }, { quoted: msg });

                        setTimeout(() => {
                            try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
                        }, 2000);

                        return;
                    } catch (dlpErr) {
                        console.error('[AUDIO] yt-dlp fallback failed:', dlpErr?.message || dlpErr);
                    }

                    // Final fallback: Alternative source
                    try {
                        const id = musicDownloader.extractVideoId(videoUrl);
                        if (!id) throw new Error('Unable to extract video ID for alternative source');
                        const resp = await alternativeSource.getAudioStreams(id);
                        if (!resp.ok) throw new Error('No audio streams available via alternative source');

                        const sorted = resp.streams
                            .slice()
                            .sort((a, b) => (parseInt(b.bitrate || '0') || 0) - (parseInt(a.bitrate || '0') || 0));
                        const preferred = sorted.find(s => (s.mimeType || '').includes('audio/mp4')) || sorted[0];
                        const mime = preferred.mimeType || 'audio/mp4';
                        const ext = mime.includes('webm') ? 'webm' : (mime.includes('mp4') ? 'm4a' : 'audio');

                        const tempDir = path.join(__dirname, '../temp');
                        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                        const tempIn = path.join(tempDir, `${Date.now()}.${ext}`);
                        const tempOut = path.join(tempDir, `${Date.now()}-conv.mp3`);

                        const dlResp = await axios({ url: preferred.url, method: 'GET', responseType: 'stream', timeout: 30000, maxRedirects: 5 });
                        await new Promise((resolve, reject) => {
                            const w = fs.createWriteStream(tempIn);
                            dlResp.data.pipe(w);
                            w.on('finish', resolve);
                            w.on('error', reject);
                        });

                        let converted = false;
                        try {
                            const ffmpeg = (await import('fluent-ffmpeg')).default;
                            await new Promise((resolve, reject) => {
                                ffmpeg(tempIn)
                                    .audioBitrate(128)
                                    .toFormat('mp3')
                                    .save(tempOut)
                                    .on('end', resolve)
                                    .on('error', reject);
                            });
                            converted = true;
                        } catch (convErr) {
                            console.warn('[AUDIO] Conversion failed, sending original file:', convErr?.message || convErr);
                        }

                        const elapsed = Date.now() - start;
                        await sock.sendMessage(chatId, {
                            audio: { url: converted ? tempOut : tempIn },
                            mimetype: converted ? 'audio/mpeg' : mime,
                            contextInfo: {
                                externalAdReply: {
                                    title: searchQuery || 'song',
                                    body: `Audio by HORLA POOKIE Bot`,
                                    thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
                                    sourceUrl: videoUrl,
                                    mediaType: 2,
                                    mediaUrl: videoUrl
                                }
                            }
                        }, { quoted: msg });

                        setTimeout(() => {
                            try { if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn); } catch {}
                            try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch {}
                        }, 2000);

                        return;
                    } catch (pErr) {
                        console.error('[AUDIO] Alternative source fallback failed:', pErr?.message || pErr);
                        return await sock.sendMessage(chatId, {
                            text: `${emojis.error} All download methods failed. Please try again later.`,
                            react: { text: emojis.error, key: msg.key }
                        }, { quoted: msg });
                    }
                }
            }
            
            if (!musicResult || !musicResult.status || !musicResult.result || !musicResult.result.download) {
                console.error(`[AUDIO] Invalid result structure:`, JSON.stringify(musicResult, null, 2));
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to get a valid download link from the API.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Download the audio file
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            let response;
            try {
                response = await axios({
                    url: musicResult.result.download,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 30000,
                    maxRedirects: 5,
                    headers: { 'user-agent': 'Mozilla/5.0' },
                    validateStatus: () => true
                });
            } catch (err) {
                logNetworkError('AUDIO.fileDownload', err);
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to download the song (network error).`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            const ctHeader = response.headers?.['content-type'];
            const ct = Array.isArray(ctHeader) ? (ctHeader[0] || '') : (ctHeader || '');
            const ctLower = ct.toLowerCase();
            const guessedExt = ctLower.includes('audio/mp4') || ctLower.includes('mp4') ? 'm4a'
                : ctLower.includes('audio/webm') ? 'webm'
                : ctLower.includes('mpeg') ? 'mp3'
                : 'm4a';
            const isAudioCT = ctLower.startsWith('audio/') || ctLower.includes('mpeg') || ctLower.includes('mp4') || ctLower.includes('webm');
            const chosenMime = isAudioCT ? ctLower : (guessedExt === 'mp3' ? 'audio/mpeg' : guessedExt === 'webm' ? 'audio/webm' : 'audio/mp4');
            const tempFile = path.join(tempDir, `${Date.now()}.${guessedExt}`);

            if (response.status < 200 || response.status >= 300) {
                console.error(`[AUDIO] HTTP error downloading file: ${response.status} ${response.statusText}`);
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to download the song file from the server.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(tempFile);
                response.data.on('error', (e) => {
                    console.error('[AUDIO] Stream error from server:', e?.message || e);
                    reject(e);
                });
                writer.on('finish', resolve);
                writer.on('close', resolve);
                writer.on('error', (e) => {
                    console.error('[AUDIO] File write error:', e?.message || e);
                    reject(e);
                });
                response.data.pipe(writer);
            });

            let fileSize = 0;
            try {
                const stats = fs.statSync(tempFile);
                fileSize = stats.size;
            } catch {}

            if (!fileSize || fileSize < 10240) {
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Song file seems invalid. Please try again.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Convert to MP3 for better compatibility if needed
            let sendPath = tempFile;
            let sendMime = chosenMime;
            let convPath = '';

            if (guessedExt !== 'mp3') {
                try {
                    const ffmpeg = (await import('fluent-ffmpeg')).default;
                    convPath = path.join(tempDir, `${Date.now()}-conv.mp3`);
                    
                    await new Promise((resolve, reject) => {
                        ffmpeg(tempFile)
                            .audioCodec('libmp3lame')
                            .audioBitrate(128)
                            .toFormat('mp3')
                            .save(convPath)
                            .on('end', resolve)
                            .on('error', reject);
                    });
                    sendPath = convPath;
                    sendMime = 'audio/mpeg';
                } catch (e) {
                    console.warn('[AUDIO] Conversion to MP3 failed, sending original file:', e?.message || e);
                }
            }

            // Send the audio as direct audio media
            const elapsed = Date.now() - start;
            await sock.sendMessage(chatId, {
                audio: { url: sendPath },
                mimetype: sendMime,
                contextInfo: {
                    externalAdReply: {
                        title: musicResult.result.title,
                        body: `${emojis.lightning} Response time: ${elapsed} ms | Powered by HORLA POOKIE Bot`,
                        thumbnailUrl: musicResult.result.thumbnail,
                        sourceUrl: videoUrl,
                        mediaType: 2,
                        mediaUrl: videoUrl
                    }
                }
            }, { quoted: msg });

            // React with success emoji
            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            // Clean up temp files
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (convPath && fs.existsSync(convPath)) fs.unlinkSync(convPath);
                } catch {}
            }, 2000);
            
        } catch (error) {
            console.error(`[AUDIO] General error:`);
            if (error?.isAxiosError) logNetworkError('AUDIO.general', error); else console.error(error);
            await sock.sendMessage(chatId, {
                text: `${emojis.error} Download failed. Please try again later.`,
                react: { text: emojis.error, key: msg.key }
            }, { quoted: msg });
        }
    }
};
