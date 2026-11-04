import androidStatements from './android-app-links.json';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
};

// These identifiers match ios/Runner.xcodeproj in the Flutter repository.
// Override with the signed build's application-identifier if its prefix differs.
const defaultIosAppId = '3XK4GQ9A6R.com.pooelcentral.giveandtake';

export function androidAssociationResponse(
  raw = process.env.ANDROID_APP_LINKS_JSON ?? JSON.stringify(androidStatements),
): Response {
  try {
    if (!raw) throw new Error('Missing ANDROID_APP_LINKS_JSON');
    const statements = JSON.parse(raw);
    if (!Array.isArray(statements) || statements.length === 0) {
      throw new Error('Expected an array of Digital Asset Links statements');
    }
    for (const statement of statements) {
      const target = statement?.target;
      if (!Array.isArray(statement?.relation) ||
          !statement.relation.includes('delegate_permission/common.handle_all_urls') ||
          target?.namespace !== 'android_app' ||
          !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(target?.package_name ?? '') ||
          !Array.isArray(target?.sha256_cert_fingerprints) ||
          target.sha256_cert_fingerprints.length === 0 ||
          !target.sha256_cert_fingerprints.every((value: unknown) =>
            typeof value === 'string' && /^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(value))) {
        throw new Error('Invalid Android association statement');
      }
    }
    return Response.json(statements, { headers });
  } catch {
    // Never publish a fabricated certificate or a cacheable empty success.
    return Response.json(
      { error: 'Android App Links signing configuration is missing or invalid.' },
      { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } },
    );
  }
}

export function appleAssociationResponse(
  raw = process.env.IOS_APP_LINKS_APP_IDS ?? defaultIosAppId,
): Response {
  const appIDs = [...new Set(raw.split(',').map(value => value.trim()).filter(Boolean))];
  if (!appIDs.length || appIDs.some(value => !/^[A-Z0-9]{10}\.[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(value))) {
    return Response.json(
      { error: 'iOS Universal Links application identifiers are missing or invalid.' },
      { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json({
    applinks: {
      apps: [],
      details: appIDs.map(appID => ({ appID, paths: ['/pages/*', '/alljobs/*'] })),
    },
  }, { headers });
}
