const builder = require('electron-builder');
const path = require('path');

console.log('🚀 Building StreamVoice for Windows...\n');

builder.build({
    targets: builder.Platform.WINDOWS.createTarget(),
    config: {
        appId: 'com.streamvoice.app',
        productName: 'StreamVoice',
        copyright: 'Copyright © 2024 StreamVoice Team',
        directories: {
            output: 'dist',
            buildResources: 'assets'
        },
        files: [
            'main.js',
            'preload.js',
            'renderer/**/*',
            'server/**/*',
            'web/**/*',
            'assets/**/*',
            'node_modules/**/*'
        ],
        extraResources: [
            {
                from: 'server',
                to: 'server'
            },
            {
                from: 'web',
                to: 'web'
            }
        ],
        win: {
            target: [
                {
                    target: 'nsis',
                    arch: ['x64', 'ia32']
                }
            ],
            icon: 'assets/icon.ico',
            publisherName: 'StreamVoice Team'
        },
        nsis: {
            oneClick: false,
            perMachine: true,
            allowToChangeInstallationDirectory: true,
            allowElevation: true,
            installerIcon: 'assets/icon.ico',
            uninstallerIcon: 'assets/icon.ico',
            installerHeaderIcon: 'assets/icon.ico',
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            shortcutName: 'StreamVoice',
            license: '../LICENSE',
            warningsAsErrors: false
        },
        publish: {
            provider: 'github',
            owner: 'guycochran',
            repo: 'streamvoice',
            releaseType: 'release'
        }
    }
}).then(() => {
    console.log('\n✅ Build complete! Check the dist folder.');
    console.log('\n📦 Installer location: dist/StreamVoice-Setup-1.0.0.exe');
}).catch((error) => {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
});