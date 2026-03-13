const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function fileExists(filePath) {
  return Boolean(filePath) && fs.existsSync(filePath);
}

function resolveWhisperConfig({ appRoot, userDataPath }) {
  const candidateBins = [
    process.env.STREAMVOICE_WHISPER_BIN,
    path.join(appRoot, 'vendor', 'whisper', 'whisper-cli'),
    path.join(appRoot, 'vendor', 'whisper', 'whisper-cli.exe'),
    path.join(appRoot, 'bin', 'whisper-cli'),
    path.join(appRoot, 'bin', 'whisper-cli.exe'),
    path.join(process.resourcesPath || '', 'whisper', 'whisper-cli.exe'),
    path.join(process.resourcesPath || '', 'whisper', 'whisper-cli')
  ].filter(Boolean);

  const candidateModels = [
    process.env.STREAMVOICE_WHISPER_MODEL,
    path.join(appRoot, 'vendor', 'whisper', 'models', 'ggml-base.en.bin'),
    path.join(userDataPath, 'whisper-models', 'ggml-base.en.bin'),
    path.join(appRoot, 'models', 'ggml-base.en.bin'),
    path.join(process.resourcesPath || '', 'whisper', 'models', 'ggml-base.en.bin')
  ].filter(Boolean);

  const binaryPath = candidateBins.find(fileExists) || null;
  const modelPath = candidateModels.find(fileExists) || null;

  return {
    binaryPath,
    modelPath
  };
}

async function transcribeWithWhisper({ audioPath, appRoot, userDataPath }) {
  const { binaryPath, modelPath } = resolveWhisperConfig({ appRoot, userDataPath });

  if (!binaryPath) {
    throw new Error('Whisper binary not found. Configure STREAMVOICE_WHISPER_BIN or bundle whisper-cli.');
  }

  if (!modelPath) {
    throw new Error('Whisper model not found. Install ggml-base.en.bin into the configured model path.');
  }

  return new Promise((resolve, reject) => {
    const args = ['-m', modelPath, '-f', audioPath, '-nt', '-of', 'stdout'];
    const child = spawn(binaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Whisper exited with code ${code}`));
        return;
      }

      const transcript = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      resolve({
        transcript
      });
    });
  });
}

module.exports = {
  resolveWhisperConfig,
  transcribeWithWhisper
};
