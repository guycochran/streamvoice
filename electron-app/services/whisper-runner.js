const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const WHISPER_TIMEOUT_MS = 20000;

function fileExists(filePath) {
  return Boolean(filePath) && fs.existsSync(filePath);
}

function buildCandidateModelPaths(modelFileName, { appRoot, userDataPath }) {
  return [
    process.env.STREAMVOICE_WHISPER_MODEL,
    path.join(appRoot, 'vendor', 'whisper', 'models', modelFileName),
    path.join(userDataPath, 'whisper-models', modelFileName),
    path.join(appRoot, 'models', modelFileName),
    path.join(process.resourcesPath || '', 'whisper', 'models', modelFileName)
  ].filter(Boolean);
}

function formatWhisperExit(code, stderr) {
  if (code === 3221225781) {
    return 'Whisper failed to start because a required Windows DLL/runtime is missing.';
  }

  if (code === 3221225501) {
    return 'Whisper crashed because the bundled binary requires unsupported CPU instructions on this machine.';
  }

  return stderr.trim() || `Whisper exited with code ${code}`;
}

function formatWhisperTimeout(stderr) {
  const details = stderr.trim();
  return details
    ? `Whisper timed out before returning a transcript. ${details}`
    : 'Whisper timed out before returning a transcript.';
}

function resolveWhisperConfig({ appRoot, userDataPath, modelPreference = 'base.en' }) {
  const candidateBins = [
    process.env.STREAMVOICE_WHISPER_BIN,
    path.join(appRoot, 'vendor', 'whisper', 'whisper-cli'),
    path.join(appRoot, 'vendor', 'whisper', 'whisper-cli.exe'),
    path.join(appRoot, 'bin', 'whisper-cli'),
    path.join(appRoot, 'bin', 'whisper-cli.exe'),
    path.join(process.resourcesPath || '', 'whisper', 'whisper-cli.exe'),
    path.join(process.resourcesPath || '', 'whisper', 'whisper-cli')
  ].filter(Boolean);

  const binaryPath = candidateBins.find(fileExists) || null;
  const preferredModelFile = modelPreference === 'tiny.en' ? 'ggml-tiny.en.bin' : 'ggml-base.en.bin';
  const fallbackModelFile = modelPreference === 'tiny.en' ? 'ggml-base.en.bin' : 'ggml-tiny.en.bin';
  const candidateModels = [
    ...buildCandidateModelPaths(preferredModelFile, { appRoot, userDataPath }),
    ...buildCandidateModelPaths(fallbackModelFile, { appRoot, userDataPath })
  ];
  const modelPath = candidateModels.find(fileExists) || null;

  return {
    binaryPath,
    modelPath,
    modelName: modelPath ? path.basename(modelPath, '.bin').replace(/^ggml-/, '') : null
  };
}

async function transcribeWithWhisper({ audioPath, appRoot, userDataPath, timeoutMs = WHISPER_TIMEOUT_MS, modelPreference = 'base.en' }) {
  const { binaryPath, modelPath, modelName } = resolveWhisperConfig({ appRoot, userDataPath, modelPreference });

  if (!binaryPath) {
    throw new Error('Whisper binary not found. Configure STREAMVOICE_WHISPER_BIN or bundle whisper-cli.');
  }

  if (!modelPath) {
    throw new Error('Whisper model not found. Install ggml-base.en.bin into the configured model path.');
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const outputBase = path.join(os.tmpdir(), `streamvoice-whisper-${Date.now()}`);
    const outputTextPath = `${outputBase}.txt`;
    const threadCount = String(Math.max(1, Math.min(os.cpus().length || 1, modelPreference === 'tiny.en' ? 8 : 6)));
    const args = [
      '-m', modelPath,
      '-f', audioPath,
      '-l', 'en',
      '-t', threadCount,
      '-nt',
      '-np',
      '-otxt',
      '-of', outputBase
    ];
    const child = spawn(binaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      reject(new Error(formatWhisperTimeout(stderr)));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(formatWhisperExit(code, stderr)));
        return;
      }

      let transcript = '';
      if (fs.existsSync(outputTextPath)) {
        transcript = fs.readFileSync(outputTextPath, 'utf8').trim();
        fs.unlinkSync(outputTextPath);
      }

      if (!transcript) {
        transcript = stdout
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .join(' ')
          .trim();
      }

      resolve({
        transcript,
        durationMs: Date.now() - startedAt,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        binaryPath,
        modelPath,
        modelName
      });
    });
  });
}

module.exports = {
  resolveWhisperConfig,
  transcribeWithWhisper
};
