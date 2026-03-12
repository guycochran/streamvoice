const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for Electron
const sizes = [16, 32, 48, 64, 128, 256];

async function generateIcons() {
    console.log('🎨 Generating app icons...');

    // For now, create simple gradient icons
    for (const size of sizes) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        // Draw rounded rectangle
        const radius = size * 0.25;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw microphone icon
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size * 0.03;

        // Microphone body
        const micWidth = size * 0.2;
        const micHeight = size * 0.35;
        const micX = (size - micWidth) / 2;
        const micY = size * 0.15;

        // Draw mic shape
        ctx.beginPath();
        ctx.arc(size / 2, micY + micWidth / 2, micWidth / 2, Math.PI, 0);
        ctx.lineTo(micX + micWidth, micY + micHeight - micWidth / 2);
        ctx.arc(size / 2, micY + micHeight - micWidth / 2, micWidth / 2, 0, Math.PI);
        ctx.closePath();
        ctx.fill();

        // Stand arc
        ctx.beginPath();
        ctx.arc(size / 2, micY + micHeight, size * 0.15, 0, Math.PI, true);
        ctx.stroke();

        // Stand base
        ctx.beginPath();
        ctx.moveTo(size / 2, micY + micHeight + size * 0.15);
        ctx.lineTo(size / 2, size * 0.75);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(size * 0.35, size * 0.75);
        ctx.lineTo(size * 0.65, size * 0.75);
        ctx.stroke();

        // Save PNG
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(__dirname, '..', 'assets', `icon-${size}.png`), buffer);
        console.log(`✅ Created icon-${size}.png`);
    }

    // Create ICO file for Windows (placeholder for now)
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
    // Copy largest PNG as ICO placeholder
    fs.copyFileSync(
        path.join(__dirname, '..', 'assets', 'icon-256.png'),
        iconPath
    );
    console.log('✅ Created icon.ico');

    // Create tray icons (smaller)
    const trayCanvas = createCanvas(16, 16);
    const trayCtx = trayCanvas.getContext('2d');

    // Simple mic icon for tray
    trayCtx.fillStyle = 'white';
    trayCtx.fillRect(6, 2, 4, 8);
    trayCtx.strokeStyle = 'white';
    trayCtx.lineWidth = 1;
    trayCtx.beginPath();
    trayCtx.arc(8, 10, 3, 0, Math.PI, true);
    trayCtx.stroke();
    trayCtx.beginPath();
    trayCtx.moveTo(8, 13);
    trayCtx.lineTo(8, 15);
    trayCtx.stroke();

    fs.writeFileSync(
        path.join(__dirname, '..', 'assets', 'tray-icon.png'),
        trayCanvas.toBuffer('image/png')
    );
    console.log('✅ Created tray-icon.png');

    // Also save as icon.png (copy of 256)
    fs.copyFileSync(
        path.join(__dirname, '..', 'assets', 'icon-256.png'),
        path.join(__dirname, '..', 'assets', 'icon.png')
    );

    // Save small icon
    fs.copyFileSync(
        path.join(__dirname, '..', 'assets', 'icon-32.png'),
        path.join(__dirname, '..', 'assets', 'icon-small.png')
    );

    console.log('🎉 All icons generated!');
}

// Run if called directly
if (require.main === module) {
    generateIcons().catch(console.error);
}

module.exports = { generateIcons };