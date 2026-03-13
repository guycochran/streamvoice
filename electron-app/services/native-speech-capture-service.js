const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function resolveBundledRecorderPath(appRoot) {
  const candidates = [
    path.join(process.resourcesPath || '', 'native-recorder', 'StreamVoiceRecorder.exe'),
    path.join(appRoot, 'vendor', 'native-recorder', 'StreamVoiceRecorder.exe')
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

class NativeSpeechCaptureService {
  constructor({ appRoot, speechCaptureDir, recorderPath }) {
    this.appRoot = appRoot;
    this.speechCaptureDir = speechCaptureDir;
    this.recorderPath = recorderPath || resolveBundledRecorderPath(appRoot);
    this.activeRecording = null;
  }

  isSupported() {
    return process.platform === 'win32' && Boolean(this.recorderPath);
  }

  buildRecordingFilePath() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.speechCaptureDir, `native-utterance-${timestamp}.wav`);
  }

  async startRecording({ deviceId, deviceLabel } = {}) {
    if (!this.isSupported()) {
      throw new Error('Native speech capture is not available on this platform');
    }

    if (this.activeRecording) {
      throw new Error('Native speech capture is already recording');
    }

    const outputPath = this.buildRecordingFilePath();
    const args = [
      '--output', outputPath
    ];

    if (deviceId) {
      args.push('--device-id', deviceId);
    }

    if (deviceLabel) {
      args.push('--device-label', deviceLabel);
    }

    const child = spawn(this.recorderPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    const recording = {
      child,
      outputPath,
      startedAt: Date.now(),
      deviceId: deviceId || '',
      deviceLabel: deviceLabel || '',
      stderr: '',
      stdout: ''
    };

    this.activeRecording = recording;

    child.stdout.on('data', (chunk) => {
      recording.stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      recording.stderr += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      const onExit = (code) => reject(new Error(`Recorder exited before ready with code ${code}`));
      const onStdout = (chunk) => {
        const text = chunk.toString();
        if (text.includes('READY')) {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        child.off('error', onError);
        child.off('exit', onExit);
        child.stdout.off('data', onStdout);
      };

      child.once('error', onError);
      child.once('exit', onExit);
      child.stdout.on('data', onStdout);
    });

    return {
      outputPath,
      startedAt: recording.startedAt,
      deviceId: recording.deviceId,
      deviceLabel: recording.deviceLabel
    };
  }

  async stopRecording() {
    if (!this.activeRecording) {
      throw new Error('Native speech capture is not recording');
    }

    const recording = this.activeRecording;
    this.activeRecording = null;

    const { child, outputPath, startedAt, deviceLabel, stderr } = recording;

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
        child.stdin.write('STOP\n');
      } catch (_error) {
        try {
          child.kill();
        } catch (killError) {
          finish(killError, true);
        }
      }
    });

    const fileStats = fs.existsSync(outputPath) ? await fs.promises.stat(outputPath) : null;

    return {
      filePath: outputPath,
      durationMs: Date.now() - startedAt,
      exitCode,
      stderr,
      deviceLabel,
      byteLength: fileStats?.size || 0
    };
  }
}

module.exports = {
  NativeSpeechCaptureService,
  resolveBundledRecorderPath
};
