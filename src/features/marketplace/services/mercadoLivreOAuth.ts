import { apiService } from '@/shared/services/api';

interface MercadoLivreToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id: string;
  issued_timestamp: number;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class MercadoLivreOAuth {
  private config: OAuthConfig;
  private tokens: MercadoLivreToken | null = null;

  constructor() {
    // Tenta obter as credenciais do localStorage primeiro, depois das variáveis de ambiente
    const savedConfig = localStorage.getItem('mercadoLivreConfig');
    const mercadoLivreConfig = savedConfig ? JSON.parse(savedConfig) : null;
    
    this.config = {
      clientId: mercadoLivreConfig?.clientId || import.meta.env.VITE_MERCADO_LIVRE_CLIENT_ID || '',
      clientSecret: mercadoLivreConfig?.clientSecret || import.meta.env.VITE_MERCADO_LIVRE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/mercado-livre/callback` // Usar a mesma URL para todos os ambientes, ajustando protocolo conforme necessário
    };
  }

  /**
   * Gera URL de autorização para o Mercado Livre
   */
  getAuthUrl(): string {
    const baseUrl = 'https://auth.mercadolivre.com.br/authorization';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state: this.generateState(),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Processa o código de autorização e obtém tokens
   */
  async exchangeCodeForToken(code: string): Promise<MercadoLivreToken> {
    const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Falha na autenticação: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      this.tokens = {
        ...tokens,
        issued_timestamp: Math.floor(Date.now() / 1000),
      };

      // Armazena tokens no localStorage
      this.saveTokens(tokens);

      return tokens;
    } catch (error) {
      console.error('Erro ao trocar código por token:', error);
      throw error;
    }
  }

  /**
   * Renova o token de acesso usando o refresh token
   */
  async refreshToken(): Promise<MercadoLivreToken> {
    if (!this.tokens?.refresh_token) {
      throw new Error('Nenhum refresh token disponível');
    }

    const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.tokens.refresh_token,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Falha ao renovar token: ${response.status} ${response.statusText}`);
      }

      const newTokens = await response.json();
      this.tokens = {
        ...newTokens,
        issued_timestamp: Math.floor(Date.now() / 1000),
      };

      // Atualiza tokens no localStorage
      this.saveTokens(newTokens);

      return newTokens;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw error;
    }
  }

  /**
   * Verifica se o token de acesso está expirado
   */
  isTokenExpired(): boolean {
    if (!this.tokens) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTime = this.tokens.issued_timestamp + this.tokens.expires_in;
    
    // Considera expirado se faltar menos de 5 minutos
    return now >= (expirationTime - 300);
  }

  /**
   * Obtém token de acesso válido (renova se necessário)
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      this.loadTokens();
    }

    if (!this.tokens) {
      throw new Error('Usuário não autenticado');
    }

    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    return this.tokens.access_token;
  }

  /**
   * Faz uma requisição autenticada à API do Mercado Livre
   */
  async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const accessToken = await this.getValidAccessToken();
    
    const url = `https://api.mercadolibre.com${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
      // Token pode ter expirado, tenta renovar e tentar novamente
      await this.refreshToken();
      const newAccessToken = await this.getValidAccessToken();
      
      (mergedOptions.headers as Record<string, string>)!['Authorization'] = `Bearer ${newAccessToken}`;
      const retryResponse = await fetch(url, mergedOptions);
      
      if (!retryResponse.ok) {
        throw new Error(`Erro na API: ${retryResponse.status} ${retryResponse.statusText}`);
      }
      
      return retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Salva tokens no localStorage
   */
  private saveTokens(tokens: MercadoLivreToken): void {
    localStorage.setItem('ml_tokens', JSON.stringify(tokens));
  }

  /**
   * Carrega tokens do localStorage
   */
  private loadTokens(): void {
    const tokensString = localStorage.getItem('ml_tokens');
    if (tokensString) {
      try {
        this.tokens = JSON.parse(tokensString);
      } catch (e) {
        console.error('Erro ao carregar tokens do localStorage:', e);
        this.tokens = null;
      }
    }
  }

  /**
   * Remove tokens do localStorage (logout)
   */
  logout(): void {
    localStorage.removeItem('ml_tokens');
    this.tokens = null;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    if (!this.tokens) {
      this.loadTokens();
    }

    return !!this.tokens && !this.isTokenExpired();
  }

  /**
   * Gera um estado aleatório para segurança OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Obtém informações do usuário autenticado
   */
  async getUserInfo(): Promise<any> {
    return this.makeAuthenticatedRequest('/users/me');
  }

  /**
   * Obtém informações da conta do Mercado Livre
   */
  async getAccountInfo(): Promise<any> {
    const userInfo = await this.getUserInfo();
    return userInfo;
  }
}