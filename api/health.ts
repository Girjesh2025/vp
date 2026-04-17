export default async function handler(req: any, res: any) {
  const isProd = process.env.NODE_ENV === 'production';
  const adminToken = process.env.HEALTHCHECK_TOKEN || '';
  const providedToken = req.headers['x-health-token'] || req.query?.token || '';
  const isAuthorized = !!adminToken && providedToken === adminToken;

  const eodhdKey = process.env.EODHD_API_TOKEN || '';
  const alphaKey = process.env.ALPHA_VANTAGE_KEY || '';
  const finnhubKey = process.env.FINNHUB_KEY || '';

  if (isProd && !isAuthorized) {
    return res.status(200).json({ ok: true });
  }

  const checks: any = {
    ok: true,
    env: {
      EODHD_API_TOKEN: !!eodhdKey,
      ALPHA_VANTAGE_KEY: !!alphaKey,
      FINNHUB_KEY: !!finnhubKey
    }
  };

  try {
    if (eodhdKey) {
      const r = await fetch(`https://eodhd.com/api/real-time/RELIANCE.NSE?api_token=${eodhdKey}&fmt=json`, { headers: { 'Accept': 'application/json' } });
      checks.eodhd = { ok: r.ok, status: r.status };
    } else {
      checks.eodhd = { ok: false, status: 0 };
    }
  } catch (e: any) {
    checks.eodhd = { ok: false, error: String(e) };
  }

  res.json(checks);
}
