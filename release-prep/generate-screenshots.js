// Screenshot Generation Script for StreamVoice
// This script can be used with Puppeteer or Playwright to capture the mockups

const puppeteer = require('puppeteer');
const path = require('path');

async function generateScreenshots() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });

    const screenshots = [
        {
            file: 'main-window.html',
            output: 'screenshot-main-window.png',
            viewport: { width: 600, height: 500 },
            fullPage: false
        },
        {
            file: 'voice-control.html',
            output: 'screenshot-voice-control.png',
            viewport: { width: 1920, height: 1080 },
            fullPage: false
        },
        {
            file: 'stream-deck.html',
            output: 'screenshot-stream-deck.png',
            viewport: { width: 1920, height: 1080 },
            fullPage: false
        },
        {
            file: 'audio-mixer.html',
            output: 'screenshot-audio-mixer.png',
            viewport: { width: 1000, height: 700 },
            fullPage: false
        }
    ];

    for (const screenshot of screenshots) {
        const page = await browser.newPage();
        await page.setViewport(screenshot.viewport);

        // Load the HTML file
        const filePath = `file://${path.join(__dirname, 'mockups', screenshot.file)}`;
        await page.goto(filePath, { waitUntil: 'networkidle2' });

        // Wait a bit for any animations
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({
            path: path.join(__dirname, 'screenshots', screenshot.output),
            fullPage: screenshot.fullPage
        });

        console.log(`Generated: ${screenshot.output}`);
        await page.close();
    }

    await browser.close();
    console.log('All screenshots generated!');
}

// Usage instructions if Puppeteer is not installed
console.log(`
To generate screenshots:

1. Install Puppeteer:
   npm install puppeteer

2. Create screenshots directory:
   mkdir screenshots

3. Run this script:
   node generate-screenshots.js

Note: You can also open the HTML files directly in Chrome and use the
built-in screenshot tool (F12 → Cmd+Shift+P → "Capture screenshot")
`);

// Uncomment to run:
// generateScreenshots().catch(console.error);