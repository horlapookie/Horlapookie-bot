
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

// Video API client
const videoApi = {
    base: 'https://api.princetechn.com/api/download/ytmp4',
    apikey: process.env.PRINCE_API_KEY || 'prince',
    async getVideoData(videoUrl) {
        const params = new URLSearchParams({ apikey: this.apikey, url: videoUrl });
        const url = `${this.base}?${params.toString()}`;
        
        const { data } = await axios.get(url, {
            timeout: 20000,
            headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' }
        });
        return data;
    }
};

const videoDownloader = {
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
                const key = videoDownloader.crypto.hexToBuffer(secretKey);
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
                url: `${endpoint.startsWith('http') ? '' : videoDownloader.api.base}${endpoint}`,
                data: method === 'post' ? data : undefined,
                params: method === 'get' ? data : undefined,
                headers: videoDownloader.headers,
                timeout: 20000,
                maxRedirects: 3,
            });
            return {
                status: true,
                code: 200,
                data: response
            };
        } catch (error) {
            logNetworkError('VIDEO_DOWNLOADER.makeRequest', error);
            throw error;
        }
    },
    getCDNHost: async () => {
        console.log(`[VIDEO_DOWNLOADER] Fetching CDN host...`);
        const response = await videoDownloader.makeRequest(videoDownloader.api.cdn, {}, 'get');
        if (!response.status) throw new Error(response);
        return {
            status: true,
            code: 200,
            data: response.data.cdn
        };
    },
    downloadVideo: async (link, format) => {
        console.log(`[VIDEO_DOWNLOADER] Starting download for: ${link}, format: ${format}`);
        
        if (!link) {
            console.log(`[VIDEO_DOWNLOADER] No link provided`);
            return {
                status: false,
                code: 400,
                error: "No link provided. Please provide a valid YouTube link."
            };
        }
        if (!format || !videoDownloader.formats.includes(format)) {
            console.log(`[VIDEO_DOWNLOADER] Invalid format: ${format}`);
            return {
                status: false,
                code: 400,
                error: "Invalid format. Please choose one of the available formats: 144, 240, 360, 480, 720, 1080.",
                available_fmt: videoDownloader.formats.filter(f => f !== 'mp3')
            };
        }
        const id = videoDownloader.extractVideoId(link);
        console.log(`[VIDEO_DOWNLOADER] Extracted YouTube ID: ${id}`);
        
        if (!id) {
            console.log(`[VIDEO_DOWNLOADER] Invalid YouTube link - no ID extracted`);
            throw new Error('Invalid YouTube link.');
        }
        
        try {
            console.log(`[VIDEO_DOWNLOADER] Getting CDN...`);
            const cdnResult = await videoDownloader.getCDNHost();
            if (!cdnResult.status) {
                console.log(`[VIDEO_DOWNLOADER] CDN request failed:`, cdnResult);
                return cdnResult;
            }
            const cdn = cdnResult.data;
            console.log(`[VIDEO_DOWNLOADER] Got CDN: ${cdn}`);
            
            console.log(`[VIDEO_DOWNLOADER] Requesting video info...`);
            const result = await videoDownloader.makeRequest(`https://${cdn}${videoDownloader.api.info}`, {
                url: `https://www.youtube.com/watch?v=${id}`
            });
            if (!result.status) {
                console.log(`[VIDEO_DOWNLOADER] Info request failed:`, result);
                return result;
            }
            console.log(`[VIDEO_DOWNLOADER] Got video info, attempting decryption...`);
            
            const decrypted = await videoDownloader.crypto.decrypt(result.data.data);
            console.log(`[VIDEO_DOWNLOADER] Decryption successful, title: ${decrypted.title}`);
            
            let downloadLink;
            try {
                console.log(`[VIDEO_DOWNLOADER] Requesting download link...`);
                downloadLink = await videoDownloader.makeRequest(`https://${cdn}${videoDownloader.api.download}`, {
                    id: id,
                    downloadType: 'video',
                    quality: format,
                    key: decrypted.key
                });
                console.log(`[VIDEO_DOWNLOADER] Download request successful`);
            } catch (error) {
                logNetworkError('VIDEO_DOWNLOADER.downloadLink', error);
                throw new Error('Failed to get download link. Please try again later.');
            }
            
            console.log(`[VIDEO_DOWNLOADER] Download URL: ${downloadLink.data.data.downloadUrl}`);
            
            return {
                status: true,
                code: 200,
                result: {
                    title: decrypted.title || "Unknown Title",
                    type: 'video',
                    format: format,
                    thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
                    download: downloadLink.data.data.downloadUrl,
                    id: id,
                    key: decrypted.key,
                    duration: decrypted.duration,
                    quality: format,
                    downloaded: downloadLink.data.data.downloaded
                }
            };
        } catch (error) {
            console.error(`[VIDEO_DOWNLOADER] Error in download function:`, error);
            throw new Error('An error occurred while processing your request. Please try again later.');
        }
    }
};

export default {
    name: 'video',
    description: 'Download and send videos from YouTube as media',
    aliases: ['vid', 'mp4', 'ytv'],
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
                    text: `${emojis.error} *Video Downloader*\n\nWhat video would you like to download?\n\nExample: \`?video Shape of You\``,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Determine if input is a YouTube link or search query
            let videoUrl = '';
            let videoTitle = '';
            
            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
            } else {
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No videos found for your search query!`,
                        react: { text: emojis.error, key: msg.key }
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title || searchQuery;
            }

            // Send preview with thumbnail
            try {
                const ytId = (videoDownloader.extractVideoId(videoUrl) || '').trim();
                const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;
                const displayTitle = videoTitle || searchQuery || 'Video';
                
                if (thumbUrl) {
                    await sock.sendMessage(chatId, {
                        image: { url: thumbUrl },
                        caption: `${emojis.video || '🎥'} *${displayTitle}*\n\n${emojis.processing} Processing your video request...`
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error('[VIDEO] Error sending preview:', e?.message || e);
            }

            // Primary: Video API
            let videoResult;
            try {
                const videoData = await videoApi.getVideoData(videoUrl);
                if (videoData?.success && videoData?.result?.download_url) {
                    videoResult = {
                        status: true,
                        code: 200,
                        result: {
                            title: videoData.result.title,
                            type: 'video',
                            format: 'mp4',
                            thumbnail: videoData.result.thumbnail,
                            download: videoData.result.download_url,
                            id: videoData.result.id,
                            quality: videoData.result.quality
                        }
                    };
                } else {
                    throw new Error('Video API did not return a download_url');
                }
            } catch (err) {
                console.error(`[VIDEO] Video API failed:`);
                if (err?.isAxiosError) logNetworkError('VIDEO.videoApi', err); else console.error(err);
                
                // Fallback to ytdl-core
                try {
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFile = path.join(tempDir, `${Date.now()}.mp4`);

                    const ytHeaders = {
                        'cookie': 'VISITOR_INFO1_LIVE=; PREF=f1=50000000&tz=UTC; YSC=',
                        'user-agent': 'Mozilla/5.0'
                    };
                    const info = await ytdl.getInfo(videoUrl, { requestOptions: { headers: ytHeaders } });
                    await new Promise(async (resolve, reject) => {
                        const ffmpeg = (await import('fluent-ffmpeg')).default;
                        const stream = ytdl(videoUrl, {
                            quality: 'highest',
                            filter: 'audioandvideo',
                            highWaterMark: 1 << 25,
                            requestOptions: { headers: ytHeaders }
                        });
                        stream.on('error', (e) => {
                            console.error('[VIDEO] ytdl stream error:', e?.message || e);
                        });
                        ffmpeg(stream)
                            .videoBitrate(1024)
                            .toFormat('mp4')
                            .save(tempFile)
                            .on('end', resolve)
                            .on('error', (e) => {
                                console.error('[VIDEO] ffmpeg error:', e?.message || e);
                                reject(e);
                            });
                    });

                    const elapsed = Date.now() - start;
                    await sock.sendMessage(chatId, {
                        video: { url: tempFile },
                        caption: `${emojis.success} *Video Download Complete*\n\n📱 *Title:* ${info?.videoDetails?.title || 'Unknown'}\n🎬 *Format:* MP4\n⭐ *Quality:* High\n${emojis.lightning} *Response time:* \`${elapsed} ms\`\n\n_Powered by HORLA POOKIE Bot_ 🤖`
                    }, { quoted: msg });

                    setTimeout(() => {
                        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                    }, 2000);

                    return;
                } catch (fbErr) {
                    console.error('[VIDEO] ytdl-core fallback failed:', fbErr?.message || fbErr);
                    
                    // Next fallback: yt-dlp
                    try {
                        if (!ytdlp) throw new Error('yt-dlp-exec not installed');
                        const tempDir = path.join(__dirname, '../temp');
                        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                        const outBase = path.join(tempDir, `${Date.now()}`);
                        const output = `${outBase}.%(ext)s`;

                        await ytdlp(videoUrl, {
                            output,
                            format: 'best[height<=480]',
                            noProgress: true,
                            noPart: true,
                            addHeader: [
                                'user-agent: Mozilla/5.0',
                                'referer: https://www.youtube.com/'
                            ]
                        });

                        const outFile = `${outBase}.mp4`;
                        
                        const elapsed = Date.now() - start;
                        await sock.sendMessage(chatId, {
                            video: { url: outFile },
                            caption: `${emojis.success} *Video Downloaded*\n\n📱 *File:* ${searchQuery || 'video'}.mp4\n🎬 *Source:* YouTube\n⭐ *Quality:* Standard\n${emojis.lightning} *Response time:* \`${elapsed} ms\`\n\n_Powered by HORLA POOKIE Bot_ 🤖`
                        }, { quoted: msg });

                        setTimeout(() => {
                            try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
                        }, 2000);

                        return;
                    } catch (dlpErr) {
                        console.error('[VIDEO] yt-dlp fallback failed:', dlpErr?.message || dlpErr);
                        return await sock.sendMessage(chatId, {
                            text: `${emojis.error} All download methods failed. Please try again later.`,
                            react: { text: emojis.error, key: msg.key }
                        }, { quoted: msg });
                    }
                }
            }
            
            if (!videoResult || !videoResult.status || !videoResult.result || !videoResult.result.download) {
                console.error(`[VIDEO] Invalid result structure:`, JSON.stringify(videoResult, null, 2));
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to get a valid download link from the API.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Download the video file
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            let response;
            try {
                response = await axios({
                    url: videoResult.result.download,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 60000,
                    maxRedirects: 5,
                    headers: { 'user-agent': 'Mozilla/5.0' },
                    validateStatus: () => true
                });
            } catch (err) {
                logNetworkError('VIDEO.fileDownload', err);
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to download the video (network error).`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            if (response.status < 200 || response.status >= 300) {
                console.error(`[VIDEO] HTTP error downloading file: ${response.status} ${response.statusText}`);
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} Failed to download the video file from the server.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            const tempFile = path.join(tempDir, `${Date.now()}.mp4`);

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(tempFile);
                response.data.on('error', (e) => {
                    console.error('[VIDEO] Stream error from server:', e?.message || e);
                    reject(e);
                });
                writer.on('finish', resolve);
                writer.on('close', resolve);
                writer.on('error', (e) => {
                    console.error('[VIDEO] File write error:', e?.message || e);
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
                    text: `${emojis.error} Video file seems invalid. Please try again.`,
                    react: { text: emojis.error, key: msg.key }
                }, { quoted: msg });
            }

            // Send the video as media directly
            const elapsed = Date.now() - start;
            await sock.sendMessage(chatId, {
                video: { url: tempFile },
                caption: `${emojis.success} *Video Download Complete*\n\n📱 *Title:* ${videoResult.result.title}\n🎬 *Format:* MP4\n⭐ *Quality:* ${videoResult.result.quality || 'High'}\n💫 *Duration:* ${videoResult.result.duration || 'Unknown'}\n${emojis.lightning} *Response time:* \`${elapsed} ms\`\n\n_Powered by HORLA POOKIE Bot_ 🤖`
            }, { quoted: msg });

            // React with success emoji
            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            // Clean up temp files
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                } catch {}
            }, 2000);
            
        } catch (error) {
            console.error(`[VIDEO] General error:`);
            if (error?.isAxiosError) logNetworkError('VIDEO.general', error); else console.error(error);
            await sock.sendMessage(chatId, {
                text: `${emojis.error} Download failed. Please try again later.`,
                react: { text: emojis.error, key: msg.key }
            }, { quoted: msg });
        }
    }
};
