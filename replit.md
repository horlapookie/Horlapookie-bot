# Overview

This is a WhatsApp bot system built using the Baileys library for Node.js. The bot serves as a comprehensive messaging platform with features including media downloads, AI integration, automation capabilities, and multi-instance support. It can handle various commands for downloading content from platforms like YouTube and Play Store, interact with AI services (OpenAI, Gemini), and provide automated responses and reactions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Framework
- **Platform**: Node.js with ES modules
- **WhatsApp Integration**: Baileys library (@whiskeysockets/baileys) for WhatsApp Web API communication
- **Authentication**: Multi-file auth state with session management and pre-key storage
- **Process Management**: Multi-instance bot support with isolated configurations and data directories

## Backend Architecture
- **Main Entry Point**: `index.js` serves as the primary bot instance
- **Server Management**: `server.js` provides Express.js web server for bot instance management
- **Instance Isolation**: `bot-instance.js` handles individual bot instances with separate auth directories
- **Command System**: Modular command structure using the `horla` framework for extensible functionality

## Configuration Management
- **Global Config**: Centralized configuration in `config.js` with API keys and bot settings
- **Instance-Specific**: Per-instance configuration files for isolated bot operations
- **Persistent Data**: Settings persistence using `lib/persistentData.js` for state management across restarts

## Data Storage
- **File-Based Storage**: JSON files for user data, moderators, banned users, and welcome configurations
- **Session Management**: Encrypted session files and pre-keys for WhatsApp authentication
- **Instance Data**: Separate data directories per bot instance to prevent conflicts

## External Service Integrations
- **AI Services**: OpenAI API for chatbot functionality and Gemini API for additional AI capabilities
- **Media Services**: Giphy API for GIF integration and Imgur for image hosting
- **Content Download**: BK9 API for APK downloads and various APIs for media content retrieval
- **Automation Features**: Auto-view, auto-react, and auto-typing capabilities for enhanced user interaction

## Security and Anti-Detection
- **Session Encryption**: Secure storage of WhatsApp session data with proper key management
- **Rate Limiting**: Message limit controls to prevent spam detection
- **Instance Isolation**: Separate authentication and data storage per bot instance
- **Automated Behaviors**: Configurable automation to mimic human-like interactions

# External Dependencies

## Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API library for bot communication
- **axios**: HTTP client for external API requests
- **express**: Web server framework for instance management interface
- **pino**: Logging library for structured logging

## Media Processing
- **@ffmpeg-installer/ffmpeg**: FFmpeg installer for media processing
- **fluent-ffmpeg**: FFmpeg wrapper for audio/video manipulation
- **jimp**: Image processing library for image manipulation
- **wa-sticker-formatter**: WhatsApp sticker creation and formatting

## AI and External APIs
- **openai**: OpenAI API client for GPT integration
- **@google/generative-ai**: Google Gemini AI integration
- **translatte**: Translation service integration
- **google-it**: Google search functionality

## Content Download and Scraping
- **@distube/ytdl-core**: YouTube video downloading
- **ytdl-core**: Alternative YouTube downloader
- **yt-search**: YouTube search functionality
- **cheerio**: HTML parsing for web scraping
- **tiktok-scraper**: TikTok content downloading

## Utilities
- **moment-timezone**: Date and time manipulation with timezone support
- **uuid**: Unique identifier generation for bot instances
- **archiver**: File compression for backup and export features
- **fs-extra**: Enhanced file system operations
- **compile-run**: Code execution capabilities for programming commands