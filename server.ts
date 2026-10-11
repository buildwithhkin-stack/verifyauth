import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Path to backend registered phone profile
const CONFIG_FILE = path.join(__dirname, 'backend', 'registered-device.json');

function getRegisteredPhoneConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data).registeredPhone;
    }
  } catch (err) {
    console.error('Error reading registered-device config:', err);
  }
  return null;
}

// Helper to check if an incoming HTTP request matches the backend registered phone
function checkDeviceAuthorization(req: Request, clientFingerprint?: any): {
  isMatch: boolean;
  matchReasons: string[];
  detectedDetails: Record<string, any>;
} {
  const config = getRegisteredPhoneConfig();
  const userAgent = req.headers['user-agent'] || '';
  const secChUaPlatform = (req.headers['sec-ch-ua-platform'] as string) || '';
  const secChUaModel = (req.headers['sec-ch-ua-model'] as string) || '';
  const clientDeviceKey = (req.headers['x-vjec-device-key'] as string) || (req.query.deviceKey as string) || '';

  const detectedDetails = {
    userAgent,
    secChUaPlatform,
    secChUaModel,
    ip: req.ip,
    clientFingerprint,
  };

  const matchReasons: string[] = [];

  if (!config || !config.isAuthorized) {
    return { isMatch: false, matchReasons, detectedDetails };
  }

  // 1. Direct hardware secret / key match
  if (clientDeviceKey && config.uniqueDeviceKey && clientDeviceKey === config.uniqueDeviceKey) {
    matchReasons.push('Hardware cryptographic device key matched');
  }

  // 2. User-Agent substrings match
  if (config.userAgentSubstrings && Array.isArray(config.userAgentSubstrings) && config.userAgentSubstrings.length > 0) {
    const allMatch = config.userAgentSubstrings.every((sub: string) =>
      userAgent.toLowerCase().includes(sub.toLowerCase())
    );
    if (allMatch) {
      matchReasons.push('Mobile browser signature & User-Agent matched registered phone build');
    }
  }

  // 3. Client Hints model match
  if (config.deviceModel && config.deviceModel !== 'PENDING_USER_INPUT') {
    const cleanModel = config.deviceModel.toLowerCase();
    if (
      userAgent.toLowerCase().includes(cleanModel) ||
      secChUaModel.toLowerCase().includes(cleanModel)
    ) {
      matchReasons.push(`Device model (${config.deviceModel}) verified against hardware headers`);
    }
  }

  // 4. Client fingerprint match (screen dimensions, WebGL vendor, touch support)
  if (clientFingerprint && config.fingerprint) {
    let fpMatches = true;
    if (config.fingerprint.screenWidth && clientFingerprint.screenWidth !== config.fingerprint.screenWidth) fpMatches = false;
    if (config.fingerprint.screenHeight && clientFingerprint.screenHeight !== config.fingerprint.screenHeight) fpMatches = false;
    if (config.fingerprint.devicePixelRatio && clientFingerprint.devicePixelRatio !== config.fingerprint.devicePixelRatio) fpMatches = false;
    if (config.fingerprint.platform && clientFingerprint.platform && !clientFingerprint.platform.toLowerCase().includes(config.fingerprint.platform.toLowerCase())) fpMatches = false;

    if (fpMatches) {
      matchReasons.push('Display dimensions & device pixel hardware fingerprint matched');
    }
  }

  const isMatch = matchReasons.length > 0;
  return { isMatch, matchReasons, detectedDetails };
}

// Endpoint: Independent server-side verification
app.post('/api/verify', (req: Request, res: Response) => {
  const { documentId, clientFingerprint } = req.body;
  const config = getRegisteredPhoneConfig();

  const authCheck = checkDeviceAuthorization(req, clientFingerprint);

  if (authCheck.isMatch) {
    return res.json({
      isRegisteredDevice: true,
      verifiedStatus: 'OFFICIAL_OWNER_VERIFIED',
      documentId,
      owner: config?.owner || 'Harikrishnak K',
      institution: config?.institution || 'Vimal Jyothi Engineering College',
      deviceModel: config?.deviceModel || 'Authorized Mobile Device',
      matchReasons: authCheck.matchReasons,
      timestamp: new Date().toISOString(),
      message: 'AUTHENTICATED: Cryptographic device proof validated. Scanned from Harikrishnak K\'s registered phone.',
    });
  }

  // Not scanned from registered phone -> strictly UNVERIFIED / Public identifier only
  return res.json({
    isRegisteredDevice: false,
    verifiedStatus: 'UNAUTHORIZED_DEVICE',
    documentId,
    timestamp: new Date().toISOString(),
    message: 'PUBLIC VIEW ONLY: Scanning device is not Harikrishnak K\'s registered phone. In accordance with VJEC security protocol, ownership proof is withheld for unauthorized devices.',
    diagnostics: {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'] || 'Unknown',
    },
  });
});

// Endpoint: Device diagnostics (helps identify phone parameters)
app.get('/api/device/inspect', (req: Request, res: Response) => {
  const config = getRegisteredPhoneConfig();
  const authCheck = checkDeviceAuthorization(req);

  res.json({
    client: {
      userAgent: req.headers['user-agent'],
      secChUa: req.headers['sec-ch-ua'],
      secChUaPlatform: req.headers['sec-ch-ua-platform'],
      secChUaModel: req.headers['sec-ch-ua-model'],
      ip: req.ip,
      headers: req.headers,
    },
    registeredConfiguredDevice: {
      owner: config?.owner,
      deviceModel: config?.deviceModel,
      isConfigured: config?.deviceModel !== 'PENDING_USER_INPUT',
    },
    isRecognizedAsRegisteredPhone: authCheck.isMatch,
    matchReasons: authCheck.matchReasons,
  });
});

// Production static serving or Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[VJEC IdeaLock Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
