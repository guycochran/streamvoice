const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const WHISPER_VERSION = 'v1.8.2';
const MODELS = [
  {
    name: 'ggml-base.en.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin?download=true'
  },
  {
    name: 'ggml-tiny.en.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin?download=true'
  }
];
const SOURCE_ZIP_URL = `https://github.com/ggml-org/whisper.cpp/archive/refs/tags/${WHISPER_VERSION}.zip`;

const appRoot = path.resolve(__dirname, '..');
const vendorRoot = path.join(appRoot, 'vendor', 'whisper');
const vendorModelDir = path.join(vendorRoot, 'models');
const vendorBinaryPath = path.join(vendorRoot, process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli');
const cacheRoot = path.join(appRoot, '.cache', 'whisper');

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
  if (process.platform === 'win32') {
    await run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `Invoke-WebRequest -Uri "${url}" -OutFile "${destination.replace(/\\/g, '\\\\')}"`
    ]);
    return;
  }

  await run('curl', ['-L', url, '-o', destination]);
}

async function extractZip(zipPath, destination) {
  await fsp.rm(destination, { recursive: true, force: true });
  await ensureDir(destination);

  if (process.platform === 'win32') {
    await run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `Expand-Archive -Force -Path "${zipPath.replace(/\\/g, '\\\\')}" -DestinationPath "${destination.replace(/\\/g, '\\\\')}"`
    ]);
    return;
  }

  await run('unzip', ['-oq', zipPath, '-d', destination]);
}

async function buildWhisperCli() {
  const zipPath = path.join(cacheRoot, `${WHISPER_VERSION}.zip`);
  const sourceRoot = path.join(cacheRoot, `src-${WHISPER_VERSION}`);
  const extractedDir = path.join(sourceRoot, `whisper.cpp-${WHISPER_VERSION.replace(/^v/, '')}`);
  const buildDir = path.join(cacheRoot, `build-${WHISPER_VERSION}`);

  await ensureDir(cacheRoot);

  if (!fs.existsSync(zipPath)) {
    console.log(`Downloading whisper.cpp ${WHISPER_VERSION} source...`);
    await downloadFile(SOURCE_ZIP_URL, zipPath);
  }

  if (!fs.existsSync(extractedDir)) {
    console.log(`Extracting whisper.cpp ${WHISPER_VERSION} source...`);
    await extractZip(zipPath, sourceRoot);
  }

  await fsp.rm(buildDir, { recursive: true, force: true });

  console.log('Configuring whisper.cpp build...');
  const cmakeArgs = ['-S', extractedDir, '-B', buildDir, '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_SHARED_LIBS=OFF'];
  if (process.platform === 'win32') {
    cmakeArgs.push('-DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded');
  }
  await run('cmake', cmakeArgs);

  console.log('Building whisper-cli...');
  await run('cmake', ['--build', buildDir, '--config', 'Release', '--target', 'whisper-cli']);

  const candidateBinaryPaths = [
    path.join(buildDir, 'bin', 'whisper-cli'),
    path.join(buildDir, 'bin', 'whisper-cli.exe'),
    path.join(buildDir, 'bin', 'Release', 'whisper-cli.exe'),
    path.join(buildDir, 'bin', 'Release', 'whisper-cli')
  ];

  const builtBinaryPath = candidateBinaryPaths.find((filePath) => fs.existsSync(filePath));
  if (!builtBinaryPath) {
    throw new Error('Built whisper-cli binary was not found after compiling whisper.cpp');
  }

  await ensureDir(vendorRoot);
  await fsp.copyFile(builtBinaryPath, vendorBinaryPath);
  const builtBinaryDir = path.dirname(builtBinaryPath);
  const builtArtifacts = await fsp.readdir(builtBinaryDir);
  for (const fileName of builtArtifacts) {
    if (!fileName.toLowerCase().endsWith('.dll')) {
      continue;
    }
    await fsp.copyFile(path.join(builtBinaryDir, fileName), path.join(vendorRoot, fileName));
  }
  if (process.platform !== 'win32') {
    await fsp.chmod(vendorBinaryPath, 0o755);
  }
}

async function ensureModels() {
  await ensureDir(vendorModelDir);

  for (const model of MODELS) {
    const destinationPath = path.join(vendorModelDir, model.name);
    if (fs.existsSync(destinationPath)) {
      continue;
    }

    console.log(`Downloading ${model.name}...`);
    await downloadFile(model.url, destinationPath);
  }
}

async function main() {
  await ensureDir(vendorRoot);
  await ensureModels();

  if (!fs.existsSync(vendorBinaryPath)) {
    await buildWhisperCli();
  }

  console.log(`Whisper assets ready:
  Binary: ${vendorBinaryPath}
  Models: ${MODELS.map((model) => path.join(vendorModelDir, model.name)).join(', ')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
