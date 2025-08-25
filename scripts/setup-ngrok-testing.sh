#!/bin/bash

# Setup script for ABA PayWay callback testing with ngrok

echo "🚀 Setting up ABA PayWay callback testing with ngrok..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   npm install -g ngrok"
    echo "   or download from: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok is installed"

# Check if Next.js server is running on port 3000
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running on port 3000"
    echo "   Please start your server first: npm run dev"
    exit 1
fi

echo "✅ Next.js server is running on port 3000"

# Start ngrok in background
echo "🌐 Starting ngrok tunnel..."
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io')

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Please check if ngrok started correctly."
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok tunnel created: $NGROK_URL"

# Update .env.local
ENV_FILE=".env.local"
BACKUP_FILE=".env.local.backup"

# Create backup
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "✅ Created backup: $BACKUP_FILE"
fi

# Update NEXT_PUBLIC_SERVER_URL
if grep -q "NEXT_PUBLIC_SERVER_URL" "$ENV_FILE"; then
    # Replace existing line
    sed -i.tmp "s|NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=$NGROK_URL|" "$ENV_FILE"
    rm "$ENV_FILE.tmp" 2>/dev/null
    echo "✅ Updated NEXT_PUBLIC_SERVER_URL in $ENV_FILE"
else
    # Add new line
    echo "NEXT_PUBLIC_SERVER_URL=$NGROK_URL" >> "$ENV_FILE"
    echo "✅ Added NEXT_PUBLIC_SERVER_URL to $ENV_FILE"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Configuration:"
echo "   ngrok URL: $NGROK_URL"
echo "   Callback URL: $NGROK_URL/api/aba-payway/callback"
echo "   Test URL: $NGROK_URL/api/aba-payway/test-callback"
echo ""
echo "🔧 Next steps:"
echo "1. Restart your Next.js server to pick up the new environment variable"
echo "2. Test the callback endpoint:"
echo "   curl -X POST $NGROK_URL/api/aba-payway/callback -d 'test=1'"
echo "3. Use the test endpoint to verify callback processing:"
echo "   curl -X POST $NGROK_URL/api/aba-payway/test-callback \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"orderId\": \"your-order-id\", \"status\": \"0\"}'"
echo ""
echo "⚠️  Important:"
echo "   - Keep this terminal open to maintain the ngrok tunnel"
echo "   - The ngrok URL will change each time you restart ngrok"
echo "   - For production, use your actual domain instead of ngrok"
echo ""
echo "🛑 To stop ngrok and restore original config:"
echo "   Press Ctrl+C or run: kill $NGROK_PID"
echo "   Restore backup: mv $BACKUP_FILE $ENV_FILE"

# Keep script running and monitor ngrok
trap "echo ''; echo '🛑 Stopping ngrok...'; kill $NGROK_PID 2>/dev/null; echo '✅ ngrok stopped'; exit 0" INT

echo ""
echo "🔄 ngrok is running... Press Ctrl+C to stop"
echo "📊 Monitor ngrok traffic at: http://localhost:4040"

# Wait for ngrok process
wait $NGROK_PID
