import { TABLEAU_CONFIG } from './config';
import { generateEmbedToken } from './embed';

interface TableauSession {
  token: string;
  siteId: string;
  userId: string;
}

interface TableauWorkbook {
  id: string;
  name: string;
  contentUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TableauView {
  id: string;
  name: string;
  contentUrl: string;
}

export class TableauRestAPI {
  private session: TableauSession | null = null;

  async authenticate(userEmail: string): Promise<TableauSession> {
    const { token } = generateEmbedToken(userEmail, 'portfolioOverview');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/auth/signin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: {
            jwt: token,
            site: { contentUrl: TABLEAU_CONFIG.siteId },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Tableau authentication failed: ${response.statusText}`);
    }

    const data = await response.json();

    this.session = {
      token: data.credentials.token,
      siteId: data.credentials.site.id,
      userId: data.credentials.user.id,
    };

    return this.session;
  }

  async getWorkbooks(): Promise<TableauWorkbook[]> {
    if (!this.session) throw new Error('Not authenticated');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/workbooks`,
      {
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch workbooks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.workbooks?.workbook || [];
  }

  async getViews(workbookId: string): Promise<TableauView[]> {
    if (!this.session) throw new Error('Not authenticated');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/workbooks/${workbookId}/views`,
      {
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch views: ${response.statusText}`);
    }

    const data = await response.json();
    return data.views?.view || [];
  }

  async refreshDataSource(datasourceId: string): Promise<void> {
    if (!this.session) throw new Error('Not authenticated');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/datasources/${datasourceId}/refresh`,
      {
        method: 'POST',
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh datasource: ${response.statusText}`);
    }
  }

  async getViewImage(viewId: string): Promise<Buffer> {
    if (!this.session) throw new Error('Not authenticated');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/views/${viewId}/image`,
      {
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get view image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async signOut(): Promise<void> {
    if (!this.session) return;

    await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/auth/signout`,
      {
        method: 'POST',
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    this.session = null;
  }
}

export const tableauAPI = new TableauRestAPI();
