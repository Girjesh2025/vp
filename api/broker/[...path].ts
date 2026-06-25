import type { VercelRequest, VercelResponse } from '@vercel/node';

const disabledError = {
  error: 'Broker connection is currently disabled in this production environment.',
};

const getPathSegments = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return value.split('/').filter(Boolean);
  return [];
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  let joined = getPathSegments(req.query.path).join('/');
  
  if (!joined && req.url) {
    const match = req.url.match(/\/api\/broker\/([^?]+)/);
    if (match) {
      joined = match[1];
    }
  }

  if (joined === 'status') {
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
    res.status(200).json({ connected: false, disabled: true });
    return;
  }

  if (joined === 'disconnect') {
    res.status(200).json({ connected: false, disabled: true });
    return;
  }

  if (
    joined === 'fyers/login-url' ||
    joined === 'fyers/exchange' ||
    joined === 'fyers/holdings' ||
    joined === 'zerodha/login-url' ||
    joined === 'zerodha/exchange'
  ) {
    res.status(501).json(disabledError);
    return;
  }

  res.status(404).json({ error: 'Broker route not found' });
}
