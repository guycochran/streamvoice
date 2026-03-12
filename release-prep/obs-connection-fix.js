// OBS Connection Fix for IPv6 Issues
// This fix tries multiple connection URLs to handle IPv6/IPv4 issues

const OBSWebSocket = require('obs-websocket-js').default;

// Try different connection URLs
const CONNECTION_URLS = [
    'ws://localhost:4455',      // Default - might resolve to IPv6
    'ws://127.0.0.1:4455',      // Force IPv4
    'ws://[::1]:4455',          // Force IPv6 localhost
    'ws://0.0.0.0:4455',        // All interfaces
];

async function findWorkingConnection() {
    const obs = new OBSWebSocket();

    console.log('🔍 Testing OBS WebSocket connections...\n');

    for (const url of CONNECTION_URLS) {
        console.log(`Trying: ${url}`);

        try {
            await obs.connect(url);
            console.log(`✅ SUCCESS! Connected using: ${url}\n`);

            // Test the connection
            const { obsVersion } = await obs.call('GetVersion');
            console.log(`OBS Version: ${obsVersion}`);

            await obs.disconnect();

            console.log('\n📝 SOLUTION:');
            console.log('Update your StreamVoice server configuration to use:');
            console.log(`const OBS_WEBSOCKET_URL = '${url}';`);

            return url;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}\n`);
        }
    }

    console.log('😞 Could not connect to OBS WebSocket on any URL.');
    console.log('\n🔧 Additional troubleshooting:');
    console.log('1. In OBS WebSocket settings, try changing "Server IP" to 127.0.0.1');
    console.log('2. Or leave it blank to bind to all interfaces');
    console.log('3. Make sure no firewall is blocking port 4455');

    return null;
}

// Run the test
findWorkingConnection();