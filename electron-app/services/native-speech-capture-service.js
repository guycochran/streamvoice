const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function resolveBundledFfmpegPath(appRoot) {
  const candidates = [
    path.join(process.resourcesPath || '', 'ffmpeg', 'ffmpeg.exe'),
    path.join(appRoot, 'vendor', 'ffmpeg', 'ffmpeg.exe'),
    path.join(appRoot, 'vendor', 'ffmpeg', 'ffmpeg')
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

class NativeSpeechCaptureService {
  constructor({ appRoot, speechCaptureDir, ffmpegPath }) {
    this.appRoot = appRoot;
    this.speechCaptureDir = speechCaptureDir;
    this.ffmpegPath = ffmpegPath || resolveBundledFfmpegPath(appRoot) || (process.platform !== 'win32' ? 'ffmpeg' : null);
    this.activeRecording = null;
  }

  isSupported() {
    return process.platform === 'win32' && Boolean(this.ffmpegPath);
  }

  buildRecordingFilePath() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.speechCaptureDir, `native-utterance-${timestamp}.wav`);
  }

  async startRecording({ deviceLabel } = {}) {
    if (!this.isSupported()) {
      throw new Error('Native speech capture is not available on this platform');
    }

    if (this.activeRecording) {
      throw new Error('Native speech capture is already recording');
    }

    const outputPath = this.buildRecordingFilePath();
    const deviceInput = deviceLabel ? `audio=${deviceLabel}` : 'audio=default';
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'dshow',
      '-i', deviceInput,
      '-ac', '1',
      '-ar', '16000',
      '-c:a', 'pcm_s16le',
      '-y',
      outputPath
    ];

    const child = spawn(this.ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.stdout.on('data', () => {});

    this.activeRecording = {
      child,
      outputPath,
      startedAt: Date.now(),
      deviceLabel: deviceLabel || 'default',
      stderr
    };

    child.stderr.on('data', (chunk) => {
      if (this.activeRecording && this.activeRecording.child === child) {
        this.activeRecording.stderr += chunk.toString();
      }
    });

    child.on('exit', (code) => {
      if (this.activeRecording && this.activeRecording.child === child) {
        this.activeRecording.exitCode = code;
      }
    });

    return {
      outputPath,
      startedAt: this.activeRecording.startedAt,
      deviceLabel: this.activeRecording.deviceLabel
    };
  }

  async stopRecording() {
    if (!this.activeRecording) {
      throw new Error('Native speech capture is not recording');
    }

    const recording = this.activeRecording;
    this.activeRecording = null;

    const { child, outputPath, startedAt, deviceLabel } = recording;

    const exitCode = await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (value, isError = false) => {
        if (settled) {
          return;
        }
        settled = true;
        if (isError) {
          reject(value);
        } else {
          resolve(value);
        }
      };

      child.once('error', (error) => finish(error, true));
      child.once('exit', (code) => finish(code));

      try {
        child.stdin.write('q\n');
      } catch (_error) {
        try {
          child.kill('SIGINT');
        } catch (killError) {
          finish(killError, true);
        }
      }

      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch (_error) {
          // ignore
        }
      }, 5000);
    });

    let fileStats = null;
    if (fs.existsSync(outputPath)) {
      fileStats = await fs.promises.stat(outputPath);
    }

    return {
      filePath: outputPath,
      durationMs: Date.now() - startedAt,
      exitCode,
      stderr: recording.stderr || '',
      deviceLabel,
      byteLength: fileStats?.size || 0
    };
  }
}

module.exports = {
  NativeSpeechCaptureService,
  resolveBundledFfmpegPath
};
