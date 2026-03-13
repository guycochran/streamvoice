const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const FFMPEG_ZIP_URL = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';

const appRoot = path.resolve(__dirname, '..');
const vendorRoot = path.join(appRoot, 'vendor', 'ffmpeg');
const cacheRoot = path.join(appRoot, '.cache', 'ffmpeg');
const zipPath = path.join(cacheRoot, 'ffmpeg-release-essentials.zip');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || appRoot,
      stdio: 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function downloadFile(url, destination) {
  await run('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    `Invoke-WebRequest -Uri "${url}" -OutFile "${destination.replace(/\\/g, '\\\\')}"`
  ]);
}

async function extractZip(source, destination) {
  await fsp.rm(destination, { recursive: true, force: true });
  await ensureDir(destination);
  await run('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    `Expand-Archive -Force -Path "${source.replace(/\\/g, '\\\\')}" -DestinationPath "${destination.replace(/\\/g, '\\\\')}"`
  ]);
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('Skipping ffmpeg asset preparation on non-Windows platform.');
    return;
  }

  await ensureDir(vendorRoot);
  await ensureDir(cacheRoot);

  if (!fs.existsSync(zipPath)) {
    console.log('Downloading ffmpeg release essentials...');
    await downloadFile(FFMPEG_ZIP_URL, zipPath);
  }

  const extractRoot = path.join(cacheRoot, 'src');
  await extractZip(zipPath, extractRoot);

  const extractedEntries = await fsp.readdir(extractRoot, { withFileTypes: true });
  const extractedDir = extractedEntries.find((entry) => entry.isDirectory());
  if (!extractedDir) {
    throw new Error('Could not locate extracted ffmpeg directory');
  }

  const binDir = path.join(extractRoot, extractedDir.name, 'bin');
  const ffmpegPath = path.join(binDir, 'ffmpeg.exe');
  const ffprobePath = path.join(binDir, 'ffprobe.exe');

  if (!fs.existsSync(ffmpegPath)) {
    throw new Error('ffmpeg.exe was not found in extracted archive');
  }

  await fsp.copyFile(ffmpegPath, path.join(vendorRoot, 'ffmpeg.exe'));
  if (fs.existsSync(ffprobePath)) {
    await fsp.copyFile(ffprobePath, path.join(vendorRoot, 'ffprobe.exe'));
  }

  console.log(`ffmpeg assets ready:
  Binary: ${path.join(vendorRoot, 'ffmpeg.exe')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
