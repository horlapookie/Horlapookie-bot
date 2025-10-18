# Overview

HORLA POOKIE is an advanced WhatsApp bot built with Node.js that provides over 300 commands across multiple categories including AI assistance, group management, media processing, gaming, and utility functions. The bot is designed to be feature-rich and user-friendly, offering capabilities from simple text commands to complex image processing and API integrations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Framework
- **Runtime**: Node.js with ES modules (type: "module")
- **WhatsApp Integration**: Built on @whiskeysockets/baileys library for WhatsApp Web API
- **Bot Structure**: Command-based architecture with individual command files in `/commands` directory
- **Session Management**: File-based session storage with authentication state persistence

## Command System
- **Command Loading**: Dynamic command loading from individual files in `/commands` directory
- **Prefix System**: Configurable command prefix (default: '.')
- **Command Categories**: Organized into categories like AI, Group management, Media processing, Utility, etc.
- **Middleware**: Built-in admin checking, permission validation, and rate limiting

## Data Management
- **Persistent Storage**: JSON file-based storage for user data, group settings, and bot configurations
- **Settings Management**: Centralized configuration system with environment variable support
- **User Data**: Tracking for banned users, moderators, group configurations, and user preferences

## Media Processing
- **Image Processing**: JIMP library for image manipulation (brightness, contrast, flip, etc.)
- **Audio Processing**: FFmpeg integration for audio effects and transformations
- **Sticker Creation**: wa-sticker-formatter for creating custom stickers
- **File Upload**: Integration with catbox.moe for media hosting

## AI Integration
- **OpenAI Integration**: GPT-4 and GPT-3.5 support for conversational AI
- **Google Gemini**: Alternative AI provider for enhanced responses
- **Custom AI Endpoints**: Support for various AI APIs with fallback mechanisms
- **Context-Aware Responses**: Chat memory system for maintaining conversation context

## Group Management
- **Admin Controls**: Promote/demote, kick/add members, group settings management
- **Anti-link System**: Configurable link detection and removal
- **Welcome Messages**: Customizable welcome/goodbye messages for new members
- **Moderation Tools**: Automated moderation with configurable actions

## External Service Integration
- **GitHub API**: Repository information, commits, issues, releases
- **Weather Services**: Weather information and forecasts
- **Financial APIs**: Forex rates, currency conversion, market data
- **Sports APIs**: Football/soccer statistics and match information
- **Social Media**: GIF search via Giphy, meme generation

## Error Handling and Reliability
- **Graceful Error Handling**: Comprehensive try-catch blocks with user-friendly error messages
- **Rate Limiting**: Built-in protection against command spam
- **Service Fallbacks**: Alternative endpoints when primary services fail
- **Connection Recovery**: Automatic reconnection handling for WhatsApp sessions

## Security Features
- **Owner Verification**: Number-based owner authentication
- **Admin-only Commands**: Permission-based command access control
- **Banned User System**: User blacklist with persistent storage
- **Input Validation**: Sanitization of user inputs and command arguments

# External Dependencies

## Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API client for bot functionality
- **pino**: High-performance logging library
- **axios**: HTTP client for API requests
- **node-fetch**: Alternative HTTP client for specific use cases

## AI and ML Services
- **OpenAI API**: GPT models for conversational AI (requires API key)
- **Google Generative AI**: Gemini models for enhanced AI responses
- **Various AI endpoints**: Multiple fallback AI services for reliability

## Media Processing
- **jimp**: Image manipulation and processing
- **fluent-ffmpeg**: Video and audio processing
- **@ffmpeg-installer/ffmpeg**: FFmpeg binary installer
- **wa-sticker-formatter**: WhatsApp sticker creation

## External APIs
- **GitHub API**: Repository and user information
- **Giphy API**: GIF search and retrieval
- **Weather APIs**: Weather data and forecasts
- **Financial APIs**: Exchange rates and market data
- **Sports APIs**: Football/soccer statistics

## Utility Libraries
- **cheerio**: HTML parsing for web scraping
- **moment-timezone**: Date and time manipulation
- **archiver**: File compression and archiving
- **jsonwebtoken**: JWT token handling
- **translatte**: Text translation services

## Development and Deployment
- **PM2**: Process management for production deployment
- **nodemon**: Development auto-restart (implied from structure)
- **Express**: Web server framework for potential web interface