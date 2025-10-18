import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

// Color function for console logs
const color = (text, colorCode) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
  };
  return colors[colorCode] ? colors[colorCode] + text + colors.reset : text;
};

// ASCII art for HORLAPOOKIE
const asciiArt = `
╔═══════════════════════════════════════════════════╗
║  ██╗  ██╗ ██████╗ ██████╗ ██╗     █████╗        ║
║  ██║  ██║██╔═══██╗██╔══██╗██║    ██╔══██╗       ║
║  ███████║██║   ██║██████╔╝██║    ███████║       ║
║  ██╔══██║██║   ██║██╔══██╗██║    ██╔══██║       ║
║  ██║  ██║╚██████╔╝██║  ██║███████╗██║  ██║       ║
║  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝       ║
║  ██████╗  ██████╗  ██████╗ ██╗  ██╗██╗███╗       ║
║  ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝██║██╔╝       ║
║  ██████╔╝██║   ██║██║   ██║█████╔╝ ██║██║        ║
║  ██╔═══╝ ██║   ██║██║   ██║██╔═██╗ ██║██║        ║
║  ██║     ╚██████╔╝╚██████╔╝██║  ██╗██║███║       ║
║  ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚══╝       ║
╚═══════════════════════════════════════════════════╝
`;

app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HORLAPOOKIE Bot Status</title>
    <style>
        body {
            background: #ffffff;
            color: #00ff88;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
            max-width: 800px;
            width: 100%;
        }

        .ascii-art {
            font-size: 12px;
            line-height: 1.2;
            white-space: pre;
            color: #00aa55;
            font-weight: 900;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.3);
            margin-bottom: 20px;
            overflow-x: auto;
        }

        .status-message {
            font-size: 24px;
            font-weight: 900;
            color: #000000;
            text-shadow: 0 0 15px rgba(0, 255, 136, 1), 2px 2px 6px rgba(0, 170, 85, 0.8);
            margin: 20px 0;
            animation: glow 2s ease-in-out infinite alternate;
            -webkit-text-stroke: 1px #00aa55;
        }

        .sub-message {
            font-size: 16px;
            color: #000000;
            font-weight: 800;
            margin: 10px 0;
            text-shadow: 1px 1px 2px rgba(0, 170, 85, 0.3);
        }

        .timestamp {
            font-size: 14px;
            color: #000000;
            font-weight: 700;
            margin-top: 30px;
        }

        .pulse {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #00ff88;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes glow {
            from { text-shadow: 0 0 15px rgba(0, 255, 136, 1), 2px 2px 6px rgba(0, 170, 85, 0.8); }
            to { text-shadow: 0 0 25px rgba(0, 255, 136, 1), 0 0 35px rgba(0, 255, 136, 1), 3px 3px 8px rgba(0, 170, 85, 1); }
        }

        @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
            100% { transform: scale(0.8); opacity: 1; }
        }

        .audio-controls {
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }

        .audio-toggle {
            background: linear-gradient(45deg, #00ff88, #00cc6a);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: #000000;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }

        .audio-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
        }

        .audio-toggle.playing {
            background: linear-gradient(45deg, #ff4444, #cc3333);
            animation: pulse-red 2s ease-in-out infinite alternate;
        }

        .volume-control {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: 15px;
        }

        .volume-slider {
            width: 100px;
            height: 5px;
            border-radius: 5px;
            background: #333;
            outline: none;
            -webkit-appearance: none;
        }

        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #00ff88;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        .volume-slider::-moz-range-thumb {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #00ff88;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        @keyframes pulse-red {
            from { box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3); }
            to { box-shadow: 0 6px 25px rgba(255, 68, 68, 0.6); }
        }

        .audio-info {
            font-size: 12px;
            color: #000000;
            font-weight: 600;
            margin-top: 10px;
        }

        @media (max-width: 768px) {
            .ascii-art {
                font-size: 8px;
            }
            .status-message {
                font-size: 20px;
            }
            .container {
                padding: 20px;
                margin: 10px;
            }
            .audio-controls {
                flex-direction: column;
                gap: 10px;
            }
            .volume-control {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="ascii-art">${asciiArt}</div>
        <div class="status-message">
            <span class="pulse"></span>
            HORLAPOOKIE BOT IS ACTIVE
        </div>
        <div class="sub-message">
            ✦✦✦ Ready to Serve ✦✦✦
        </div>
        <div class="sub-message">
            🤖 WhatsApp Bot Online & Operational
        </div>

        <div class="audio-controls">
            <button id="audioToggle" class="audio-toggle">🎵 Play Music</button>
            <div class="volume-control">
                <span style="color: #00ff88;">🔊</span>
                <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="50">
                <span id="volumeDisplay" style="color: #000000; font-weight: 700; font-size: 12px;">50%</span>
            </div>
        </div>

        <div class="audio-info">
            <span id="audioStatus">🎵 Background music available</span>
        </div>

        <div class="timestamp">
            Server Time: ${new Date().toLocaleString()}
        </div>

        <audio id="backgroundAudio" loop preload="auto" crossorigin="anonymous">
            <!-- Custom audio file -->
            <source src="https://files.catbox.moe/1qglzs.mp3" type="audio/mpeg">
            <!-- Fallback sources -->
            <source src="./audio/background.mp3" type="audio/mpeg">
            <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQgAAAABhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzhAn+Dywm0zIwgHVmTA5LlnOhcUXbPpjJxAHFAZdNiP3LhaNQIGFrbP4vZMOAhfvW" type="audio/wav">
        </audio>

        <script>
        const audioToggle = document.getElementById('audioToggle');
        const backgroundAudio = document.getElementById('backgroundAudio');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeDisplay = document.getElementById('volumeDisplay');
        const audioStatus = document.getElementById('audioStatus');
        let isPlaying = false;

        // Set initial volume
        backgroundAudio.volume = 0.5;

        audioToggle.addEventListener('click', function() {
            if (!isPlaying) {
                backgroundAudio.play().then(() => {
                    isPlaying = true;
                    audioToggle.textContent = '🔇 Stop Music';
                    audioToggle.classList.add('playing');
                    audioStatus.textContent = '🎵 Playing background music...';
                }).catch((error) => {
                    console.log('Audio play failed:', error);
                    audioStatus.textContent = '❌ Audio playback failed (browser policy)';
                });
            } else {
                backgroundAudio.pause();
                backgroundAudio.currentTime = 0;
                isPlaying = false;
                audioToggle.textContent = '🎵 Play Music';
                audioToggle.classList.remove('playing');
                audioStatus.textContent = '🎵 Background music stopped';
            }
        });

        volumeSlider.addEventListener('input', function() {
            const volume = volumeSlider.value / 100;
            backgroundAudio.volume = volume;
            volumeDisplay.textContent = volumeSlider.value + '%';
        });

        // Handle audio events
        backgroundAudio.addEventListener('ended', function() {
            isPlaying = false;
            audioToggle.textContent = '🎵 Play Music';
            audioToggle.classList.remove('playing');
            audioStatus.textContent = '🎵 Music ended';
        });

        backgroundAudio.addEventListener('error', function() {
            audioStatus.textContent = '❌ Audio source unavailable';
        });

        // Auto-play attempt (will be blocked by most browsers)
        document.addEventListener('click', function() {
            if (!isPlaying && !backgroundAudio.played.length) {
                // First user interaction - can attempt autoplay
                audioStatus.textContent = '🎵 Click play button to start music';
            }
        }, { once: true });
        </script>
    </div>
</body>
</html>
  `;

  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'active',
    message: 'HORLAPOOKIE BOT IS ACTIVE AND READY TO SERVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Audio file endpoint - serves a simple tone
app.get('/audio/background.mp3', (req, res) => {
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'inline; filename="background.mp3"');

  // Simple audio response - you can replace this with actual audio file
  const audioBuffer = Buffer.from([
    // MP3 header and basic audio data (very minimal)
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x03, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  res.send(audioBuffer);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(color('🌐 Web interface running on http://0.0.0.0:' + PORT, 'cyan'));
  console.log(color('🔗 Bot status page available at: http://0.0.0.0:' + PORT, 'cyan'));
});

export default app;