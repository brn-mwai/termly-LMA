import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TABLEAU_CONFIG, DASHBOARDS, DashboardKey } from './config';

interface EmbedTokenResult {
  token: string;
  expiresAt: Date;
  viewUrl: string;
  dashboardName: string;
}

export function generateEmbedToken(
  userEmail: string,
  dashboardKey: DashboardKey,
  parameters?: Record<string, string>
): EmbedTokenResult {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 10 * 60; // 10 minutes

  // JWT payload for Tableau Connected Apps
  const payload = {
    iss: TABLEAU_CONFIG.tokenName,
    sub: userEmail,
    aud: 'tableau',
    exp,
    jti: uuidv4(),
    scp: ['tableau:views:embed', 'tableau:views:embed_authoring'],
  };

  // Sign the JWT
  const token = jwt.sign(payload, TABLEAU_CONFIG.tokenSecret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      kid: TABLEAU_CONFIG.tokenName,
    } as jwt.JwtHeader,
  });

  const dashboard = DASHBOARDS[dashboardKey];
  let viewUrl = `${TABLEAU_CONFIG.serverUrl}/t/${TABLEAU_CONFIG.siteId}/views/${dashboard.path}`;

  // Add parameters if provided (e.g., for loan detail dashboard)
  if (parameters && Object.keys(parameters).length > 0) {
    const params = new URLSearchParams(parameters);
    viewUrl += `?${params.toString()}`;
  }

  return {
    token,
    expiresAt: new Date(exp * 1000),
    viewUrl,
    dashboardName: dashboard.name,
  };
}

// Check if Tableau is configured
export function isTableauConfigured(): boolean {
  return !!(
    TABLEAU_CONFIG.serverUrl &&
    TABLEAU_CONFIG.siteId &&
    TABLEAU_CONFIG.tokenName &&
    TABLEAU_CONFIG.tokenSecret
  );
}
