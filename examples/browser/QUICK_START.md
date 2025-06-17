# Quick Start Guide

Get the Nosana SDK Browser Playground running in under 2 minutes!

## 🚀 One-Command Start

```bash
cd examples/browser && ./start.sh
```

That's it! The script will:
- ✅ Check your Node.js version
- 📦 Install dependencies if needed
- 🌐 Start the development server
- 🎯 Open at http://localhost:3000

## 📋 What You'll See

When you open the playground, you'll find:

### Left Panel - Controls
1. **SDK Initialization** - Network selection and connection testing
2. **Job Operations** - Get individual jobs or browse all jobs with filters
3. **Market Operations** - Explore available markets
4. **Real-time Monitoring** - Watch live blockchain updates
5. **Clear Logs** - Reset the terminal output

### Right Panel - Terminal Output
- 🖥️ Terminal-style logging with timestamps
- 🎨 Color-coded messages (info, success, error, warning)
- 📜 Auto-scroll toggle
- 📊 Line counter

## 🎯 Try These First

1. **Test Connection**: Click "Test Connection" to verify everything works
2. **Get a Job**: Use the pre-filled job address and click "Get Job"
3. **Browse Markets**: Click "Get All Markets" to see available markets
4. **Start Monitoring**: Click "Start Monitoring" to see live updates

## 🔧 Troubleshooting

### Port Already in Use?
```bash
# Kill any process using port 3000
npx kill-port 3000
# Then restart
npm run dev
```

### Dependencies Issues?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### SDK Errors?
- Check your internet connection
- Try switching networks (Mainnet ↔ Devnet)
- Look at browser console for detailed errors

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed usage
- Check [FEATURES.md](./FEATURES.md) for complete feature list
- Explore the [source code](./app.vue) to understand implementation

## 🆘 Need Help?

- Check browser console for errors
- Verify Node.js version (20.18.0+)
- Ensure stable internet connection
- Try different networks if one fails

Happy testing! 🎉 