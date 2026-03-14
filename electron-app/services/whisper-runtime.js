const { resolveWhisperConfig: resolveCliWhisperConfig, transcribeWithWhisper: transcribeWithCliWhisper } = require('./whisper-runner');

const ADDON_CANDIDATES = [
  {
    id: 'kutalia',
    packageName: '@kutalia/whisper-node-addon'
  },
  {
    id: 'fugood',
    packageName: '@fugood/whisper.node'
  }
];

const fugoodContexts = new Map();

function normalizeSpeechRuntime(runtime) {
  const normalized = String(runtime || '').trim().toLowerCase();
  if (normalized === 'addon' || normalized === 'addon-kutalia' || normalized === 'kutalia' || normalized === 'addon-fugood' || normalized === 'fugood') {
    return normalized;
  }
  return 'cli';
}

function resolveCandidatePackage(candidate) {
  try {
    const resolvedPath = require.resolve(candidate.packageName);
    let loadError = null;
    try {
      loadAddonModule(candidate.packageName);
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error || 'Unknown addon load failure');
    }
    return {
      ...candidate,
      available: !loadError,
      installed: true,
      resolvedPath,
      loadError
    };
  } catch (_error) {
    return {
      ...candidate,
      available: false,
      installed: false,
      resolvedPath: null,
      loadError: null
    };
  }
}

function resolveRequestedAddonCandidate(runtime) {
  if (runtime === 'addon-kutalia' || runtime === 'kutalia') {
    return 'kutalia';
  }
  if (runtime === 'addon-fugood' || runtime === 'fugood') {
    return 'fugood';
  }
  return null;
}

function resolveAddonCandidate(runtime) {
  const requestedCandidateId = resolveRequestedAddonCandidate(runtime);
  const candidates = ADDON_CANDIDATES.map(resolveCandidatePackage);
  const selected = requestedCandidateId
    ? candidates.find((candidate) => candidate.id === requestedCandidateId) || null
    : candidates.find((candidate) => candidate.available) || null;

  return {
    candidates,
    selected
  };
}

function buildAddonRuntimeMessage(runtime, selectedCandidate) {
  if (selectedCandidate?.available) {
    return `Using ${selectedCandidate.packageName} as the experimental Whisper addon runtime.`;
  }

  if (selectedCandidate?.installed && selectedCandidate?.loadError) {
    return `${selectedCandidate.packageName} is installed but could not load: ${selectedCandidate.loadError}. Falling back to the CLI runtime.`;
  }

  const requestedCandidateId = resolveRequestedAddonCandidate(runtime);
  if (requestedCandidateId) {
    const requested = ADDON_CANDIDATES.find((candidate) => candidate.id === requestedCandidateId);
    return `${requested?.packageName || requestedCandidateId} is not installed. Falling back to the CLI runtime.`;
  }

  return 'No supported Whisper addon package is installed. Falling back to the CLI runtime.';
}

function resolveWhisperRuntimeConfig(options = {}) {
  const runtime = normalizeSpeechRuntime(options.runtime || process.env.STREAMVOICE_WHISPER_RUNTIME || 'cli');
  const cliConfig = resolveCliWhisperConfig(options);
  const modelStatus = cliConfig.modelPath ? 'ready' : 'not_installed';

  if (runtime !== 'cli') {
    const { selected } = resolveAddonCandidate(runtime);
    const addonAvailable = Boolean(selected?.available && cliConfig.modelPath);
    return {
      runtime,
      requestedRuntime: runtime,
      resolvedRuntime: addonAvailable ? 'addon' : 'cli',
      available: addonAvailable || Boolean(cliConfig.binaryPath && cliConfig.modelPath),
      binaryPath: addonAvailable ? selected.packageName : cliConfig.binaryPath,
      compatBinaryPath: cliConfig.compatBinaryPath,
      modelPath: cliConfig.modelPath,
      modelName: cliConfig.modelName || options.modelPreference || 'base.en',
      modelStatus,
      runtimeStatus: addonAvailable ? 'addon_ready' : 'addon_fallback_cli',
      runtimeMessage: buildAddonRuntimeMessage(runtime, selected),
      addonCandidate: selected?.id || null,
      addonPackage: selected?.packageName || null,
      addonResolvedPath: selected?.resolvedPath || null,
      addonLoadError: selected?.loadError || null
    };
  }

  return {
    runtime,
    requestedRuntime: runtime,
    resolvedRuntime: 'cli',
    available: Boolean(cliConfig.binaryPath && cliConfig.modelPath),
    ...cliConfig,
    modelStatus: cliConfig.binaryPath && cliConfig.modelPath ? 'ready' : 'not_installed',
    runtimeStatus: 'ready',
    runtimeMessage: null,
    addonCandidate: null,
    addonPackage: null,
    addonResolvedPath: null,
    addonLoadError: null
  };
}

function extractTranscriptText(result) {
  if (!result) {
    return '';
  }

  if (typeof result === 'string') {
    return result.trim();
  }

  if (Array.isArray(result)) {
    return result
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (Array.isArray(entry)) {
          return entry[2] || entry[1] || entry[0] || '';
        }
        if (entry && typeof entry === 'object') {
          return entry.text || entry.speech || entry.result || '';
        }
        return '';
      })
      .join(' ')
      .trim();
  }

  if (typeof result === 'object') {
    if (typeof result.text === 'string') {
      return result.text.trim();
    }
    if (typeof result.result === 'string') {
      return result.result.trim();
    }
    if (Array.isArray(result.result)) {
      return extractTranscriptText(result.result);
    }
    if (Array.isArray(result.segments)) {
      return extractTranscriptText(result.segments);
    }
  }

  return '';
}

function loadAddonModule(packageName) {
  const loaded = require(packageName);
  return loaded?.default || loaded;
}

async function transcribeWithKutaliaAddon({ audioPath, modelPath, modelName }) {
  const startedAt = Date.now();
  const whisper = loadAddonModule('@kutalia/whisper-node-addon');

  if (!whisper || typeof whisper.transcribe !== 'function') {
    throw new Error('@kutalia/whisper-node-addon did not expose a compatible transcribe() API.');
  }

  const result = await whisper.transcribe({
    fname_inp: audioPath,
    model: modelPath,
    language: 'en',
    use_gpu: false
  });

  return {
    transcript: extractTranscriptText(result),
    durationMs: Date.now() - startedAt,
    stdout: '',
    stderr: '',
    binaryPath: '@kutalia/whisper-node-addon',
    modelPath,
    modelName,
    addonPackage: '@kutalia/whisper-node-addon'
  };
}

async function getFugoodContext(modelPath) {
  const cached = fugoodContexts.get(modelPath);
  if (cached?.context) {
    return cached.context;
  }

  const whisperNode = loadAddonModule('@fugood/whisper.node');
  const initWhisper = whisperNode?.initWhisper;
  if (typeof initWhisper !== 'function') {
    throw new Error('@fugood/whisper.node did not expose a compatible initWhisper() API.');
  }

  const context = await initWhisper({
    model: modelPath,
    useGpu: false
  });

  fugoodContexts.set(modelPath, { context });
  return context;
}

async function transcribeWithFugoodAddon({ audioPath, modelPath, modelName }) {
  const startedAt = Date.now();
  const context = await getFugoodContext(modelPath);
  if (!context || typeof context.transcribeFile !== 'function') {
    throw new Error('@fugood/whisper.node context did not expose a compatible transcribeFile() API.');
  }

  const transcription = context.transcribeFile(audioPath, {
    language: 'en',
    temperature: 0.0
  });

  const result = transcription?.promise ? await transcription.promise : await transcription;

  return {
    transcript: extractTranscriptText(result),
    durationMs: Date.now() - startedAt,
    stdout: '',
    stderr: '',
    binaryPath: '@fugood/whisper.node',
    modelPath,
    modelName,
    addonPackage: '@fugood/whisper.node'
  };
}

async function transcribeWithAddonRuntime(config, options = {}) {
  const selected = config.addonCandidate;
  if (selected === 'kutalia') {
    return transcribeWithKutaliaAddon({
      audioPath: options.audioPath,
      modelPath: config.modelPath,
      modelName: config.modelName
    });
  }

  if (selected === 'fugood') {
    return transcribeWithFugoodAddon({
      audioPath: options.audioPath,
      modelPath: config.modelPath,
      modelName: config.modelName
    });
  }

  throw new Error('No compatible Whisper addon candidate is installed.');
}

async function transcribeWithWhisperRuntime(options = {}) {
  const runtime = normalizeSpeechRuntime(options.runtime || process.env.STREAMVOICE_WHISPER_RUNTIME || 'cli');
  const config = resolveWhisperRuntimeConfig({
    ...options,
    runtime
  });

  if (config.resolvedRuntime === 'addon') {
    try {
      const result = await transcribeWithAddonRuntime(config, options);
      return {
        runtime,
        runtimeRequested: runtime,
        runtimeResolved: 'addon',
        runtimeFallbackUsed: false,
        ...result
      };
    } catch (error) {
      const cliResult = await transcribeWithCliWhisper(options);
      return {
        runtime,
        runtimeRequested: runtime,
        runtimeResolved: 'cli',
        runtimeFallbackUsed: true,
        runtimeFallbackReason: error.message,
        addonPackage: config.addonPackage,
        ...cliResult
      };
    }
  }

  const result = await transcribeWithCliWhisper(options);
  return {
    runtime,
    runtimeRequested: runtime,
    runtimeResolved: 'cli',
    runtimeFallbackUsed: runtime !== 'cli',
    runtimeFallbackReason: runtime !== 'cli' ? config.runtimeMessage : null,
    addonPackage: config.addonPackage || null,
    ...result
  };
}

module.exports = {
  normalizeSpeechRuntime,
  resolveWhisperRuntimeConfig,
  transcribeWithWhisperRuntime
};
