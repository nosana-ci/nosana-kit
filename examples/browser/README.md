# Nosana SDK Browser Playground

An interactive documentation and testing environment for the Nosana SDK built with Nuxt 3. This playground allows you to test SDK functionality directly in your browser with a beautiful, modern interface.

## Features

- 🚀 **Interactive SDK Testing**: Test all major SDK functions with a user-friendly interface
- 🌐 **Network Switching**: Easily switch between Mainnet and Devnet
- 📊 **Real-time Monitoring**: Monitor job, run, and market account updates in real-time
- 🖥️ **Terminal-style Logging**: Beautiful terminal-like output for all operations
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Development**: Hot reload and modern development experience

## Available Operations

### SDK Initialization
- Initialize the Nosana SDK for different networks
- Test connection to Solana RPC endpoints
- View configuration details

### Job Operations
- **Get Job by Address**: Retrieve detailed information about a specific job
- **Get All Jobs with Filters**: Fetch multiple jobs with optional state filtering
- **Real-time Job Monitoring**: Watch for job account updates

### Market Operations
- **Get All Markets**: Retrieve all available markets
- **Market Monitoring**: Watch for market account updates

### Real-time Monitoring
- **WebSocket Subscriptions**: Real-time updates for job, run, and market accounts
- **Error Handling**: Automatic reconnection and error reporting
- **Live Logging**: See updates as they happen

## Getting Started

### Prerequisites

- Node.js 20.18.0 or higher
- npm or yarn

### Installation

1. Navigate to the browser example directory:
```bash
cd examples/browser
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### 1. Network Selection
- Use the network dropdown in the header to switch between Mainnet and Devnet
- The SDK will automatically reinitialize when you change networks
- Connection status is displayed with a colored indicator

### 2. Testing SDK Functions

#### Get Job by Address
1. Enter a valid job address in the input field (default example provided)
2. Click "Get Job" to retrieve job details
3. View the results in the terminal output

#### Get All Jobs with Filters
1. Optionally select a job state filter (Queued, Running, Stopped, Done)
2. Set a limit for the number of jobs to retrieve (default: 10)
3. Click "Get Jobs" to fetch filtered results

#### Get All Markets
1. Click "Get All Markets" to retrieve all available markets
2. View market details including pricing and configuration

### 3. Real-time Monitoring
1. Click "Start Monitoring" to begin real-time account monitoring
2. The system will watch for updates to job, run, and market accounts
3. Updates will appear in the terminal as they happen
4. Click "Stop Monitoring" to end the monitoring session

### 4. Terminal Output
- All operations log their results to the terminal-style output panel
- Different log types are color-coded:
  - 🔵 **Info**: General information (blue)
  - ✅ **Success**: Successful operations (green)
  - ❌ **Error**: Errors and failures (red)
  - ⚠️ **Warning**: Warnings and notices (yellow)
- Use "Auto-scroll: ON/OFF" to control automatic scrolling
- Click "Clear Logs" to reset the terminal

## Example Job Addresses

For testing purposes, you can use these example job addresses:

**Mainnet:**
- `BwBURHTRMM3Ckzo2Dzmw99hv6gV8Ve12b6iw4sm9qeyR`

**Devnet:**
- Check the latest jobs using the "Get All Jobs" function

## Development

### Project Structure

```
examples/browser/
├── app.vue                 # Main application component
├── nuxt.config.ts         # Nuxt configuration
├── assets/css/main.css    # Custom styles and Tailwind
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Key Technologies

- **Nuxt 3**: Vue.js framework for the frontend
- **Tailwind CSS**: Utility-first CSS framework for styling
- **@nosana/kit**: The Nosana SDK for blockchain interactions
- **Vue 3 Composition API**: Modern Vue.js reactive programming

### Configuration

The application is configured to:
- Disable SSR for better Solana SDK compatibility
- Enable WASM support for blockchain operations
- Optimize dependencies for faster loading
- Use Tailwind CSS for styling

## Troubleshooting

### Common Issues

1. **SDK Initialization Fails**
   - Check your internet connection
   - Verify the selected network is accessible
   - Check browser console for detailed error messages

2. **Job Not Found**
   - Ensure the job address is valid and exists on the selected network
   - Try switching networks if the job exists on a different network

3. **Monitoring Connection Issues**
   - WebSocket connections may fail due to network issues
   - The system will automatically attempt to reconnect
   - Check the terminal output for connection status

### Browser Compatibility

This playground works best with modern browsers that support:
- WebSockets
- ES2020+ JavaScript features
- WebAssembly (WASM)

## Contributing

To contribute to this example:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This example is part of the Nosana SDK and follows the same MIT license.

## Support

For support and questions:
- Check the main Nosana SDK documentation
- Open an issue in the repository
- Join the Nosana community channels
