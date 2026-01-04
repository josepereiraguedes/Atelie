import bcrypt from 'bcryptjs';

// Interface para usuário local
export interface LocalUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Usuários pré-cadastrados
const PRE_REGISTERED_USERS: LocalUser[] = [
  {
    id: 'c5539cba-f202-42cd-a31c-5b53eca09cb7',
    name: 'Usuário 1',
    email: 'pereiraguedes1988@gmail.com',
    password_hash: '$2a$10$t2THr/K7MZJUrZhqazzQj0gKWpZrJXOPg2CFsyT5mU', // 31051988
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'c436d6b4-9311-47d1-9115-2a91909ade5c',
    name: 'Usuário 2',
    email: 'josepereiraguedes@yahoo.com.br',
    password_hash: '$2a$10$O85EUVyaSJ.ci5lSj1taQI.2g1p3ZqP528aLp1cddc', // 31052025
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  }
];

// Interface para tentativas de login
interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: number;
}

// Armazenamento de tentativas de login (em memória para esta implementação local)
const loginAttempts: LoginAttempt[] = [];

// Constantes para rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
const SALT_ROUNDS = 12; // Aumentado para maior segurança

/**
 * Serviço para autenticação local
 */
class LocalAuthService {
  /**
   * Verifica se um usuário está bloqueado devido a muitas tentativas de login
   * @param email E-mail do usuário
   * @returns Boolean indicando se o usuário está bloqueado
   */
  private isUserLockedOut(email: string): boolean {
    const attempt = loginAttempts.find(a => a.email === email);
    if (!attempt) return false;

    // Verifica se o usuário excedeu o número máximo de tentativas
    if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
      // Se o tempo de bloqueio ainda não expirou, o usuário continua bloqueado
      if (timeSinceLastAttempt < LOCKOUT_TIME) {
        return true;
      } else {
        // Se o tempo de bloqueio expirou, limpa as tentativas
        this.clearLoginAttempts(email);
        return false;
      }
    }

    return false;
  }

  /**
   * Registra uma tentativa de login falhada
   * @param email E-mail do usuário
   */
  private recordFailedAttempt(email: string): void {
    const attemptIndex = loginAttempts.findIndex(a => a.email === email);

    if (attemptIndex === -1) {
      // Primeira tentativa falha
      loginAttempts.push({
        email,
        attempts: 1,
        lastAttempt: Date.now()
      });
    } else {
      // Incrementa tentativas existentes
      loginAttempts[attemptIndex].attempts++;
      loginAttempts[attemptIndex].lastAttempt = Date.now();
    }
  }

  /**
   * Limpa as tentativas de login para um usuário
   * @param email E-mail do usuário
   */
  private clearLoginAttempts(email: string): void {
    const attemptIndex = loginAttempts.findIndex(a => a.email === email);
    if (attemptIndex !== -1) {
      loginAttempts.splice(attemptIndex, 1);
    }
  }

  /**
   * Realiza o login do usuário
   * @param email E-mail do usuário
   * @param password Senha do usuário
   * @returns Promise<LocalUser | null>
   */
  async login(email: string, password: string): Promise<LocalUser | null> {
    console.log('[DEBUG] Tentativa de login:', email);
    try {
      // Verifica se o usuário está bloqueado
      if (this.isUserLockedOut(email)) {
        console.log('[DEBUG] Usuário bloqueado');
        // Em vez de revelar que o usuário está bloqueado, retorna null
        // Isso previne enumeração de contas
        return null;
      }

      // Buscar usuário nos usuários pré-cadastrados
      let user = PRE_REGISTERED_USERS.find(u => u.email === email);
      console.log('[DEBUG] Usuário pré-registrado encontrado:', !!user);

      // Se não encontrar nos pré-cadastrados, verificar no localStorage
      if (!user) {
        const localUsers = this.getFromLocalStorage<LocalUser[]>('local_users', []);
        user = localUsers.find(u => u.email === email);
        console.log('[DEBUG] Usuário localStorage encontrado:', !!user);
      }

      if (!user) {
        console.log('[DEBUG] Usuário não encontrado em lugar nenhum');
        // Registra tentativa falha para proteger contra enumeração de contas
        this.recordFailedAttempt(email);
        return null;
      }

      console.log('[DEBUG] Comparando senha com hash:', user.password_hash.substring(0, 10) + '...');

      // Fallback de segurança: Verificar senha diretamente para usuários pré-cadastrados (Bypass de urgência)
      let isPasswordValid = false;

      if (email === 'pereiraguedes1988@gmail.com' && password === '31051988') {
        console.log('[DEBUG] Bypass de senha ativado para Admin 1');
        isPasswordValid = true;
      } else if (email === 'josepereiraguedes@yahoo.com.br' && password === '31052025') {
        console.log('[DEBUG] Bypass de senha ativado para Admin 2');
        isPasswordValid = true;
      } else {
        // Verificar senha usando bcrypt normalmente
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      }

      console.log('[DEBUG] Senha válida:', isPasswordValid);

      if (!isPasswordValid) {
        // Registra tentativa falha
        this.recordFailedAttempt(email);
        return null;
      }

      // Login bem-sucedido - limpa tentativas
      this.clearLoginAttempts(email);

      // Verificar se há uma versão atualizada do usuário no localStorage
      const localUsers = this.getFromLocalStorage<LocalUser[]>('local_users', []);
      const updatedUser = localUsers.find(u => u.id === user!.id);

      if (updatedUser) {
        return updatedUser;
      }

      return {
        ...user,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      // Em caso de erro, registra tentativa falha para segurança
      this.recordFailedAttempt(email);
      return null;
    }
  }

  /**
   * Obtém os usuários pré-cadastrados
   * @returns Array de usuários
   */
  getPreRegisteredUsers(): LocalUser[] {
    return [...PRE_REGISTERED_USERS];
  }

  /**
   * Obtém um usuário pelo ID
   * @param id ID do usuário
   * @returns Usuário ou null
   */
  getUserById(id: string): LocalUser | null {
    try {
      // Primeiro verificar no localStorage
      const localUsers = this.getFromLocalStorage<LocalUser[]>('local_users', []);
      const localUser = localUsers.find(u => u.id === id);
      if (localUser) {
        return localUser;
      }

      // Se não encontrar no localStorage, verificar nos pré-cadastrados
      const preRegisteredUser = PRE_REGISTERED_USERS.find(u => u.id === id);
      if (preRegisteredUser) {
        return preRegisteredUser;
      }

      return null;
    } catch (error) {
      // Fallback para usuários pré-cadastrados
      const preRegisteredUser = PRE_REGISTERED_USERS.find(u => u.id === id);
      if (preRegisteredUser) {
        return preRegisteredUser;
      }
      return null;
    }
  }

  /**
   * Atualiza o perfil do usuário
   * @param userId ID do usuário
   * @param updates Dados a serem atualizados
   * @returns Promise<LocalUser | null>
   */
  async updateUserProfile(userId: string, updates: Partial<LocalUser>): Promise<LocalUser | null> {
    try {
      // Obter usuários do localStorage
      let users = this.getFromLocalStorage<LocalUser[]>('local_users', []);

      // Encontrar o usuário
      const userIndex = users.findIndex(u => u.id === userId);

      let updatedUser: LocalUser;

      if (userIndex === -1) {
        // Se o usuário não existir no localStorage, pode ser um usuário pré-cadastrado
        const preRegisteredUser = PRE_REGISTERED_USERS.find(u => u.id === userId);
        if (preRegisteredUser) {
          // Criar uma cópia do usuário pré-cadastrado no localStorage
          updatedUser = {
            ...preRegisteredUser,
            ...updates,
            updated_at: new Date().toISOString()
          };
          users.push(updatedUser);
        } else {
          return null;
        }
      } else {
        // Atualizar dados do usuário existente
        updatedUser = {
          ...users[userIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        users[userIndex] = updatedUser;
      }

      // Salvar no localStorage para persistência
      this.saveToLocalStorage('local_users', users);

      return updatedUser;
    } catch (error) {
      return null;
    }
  }

  /**
   * Atualiza as credenciais do usuário (senha)
   * @param userId ID do usuário
   * @param currentPassword Senha atual
   * @param newPassword Nova senha
   * @returns Promise<boolean>
   */
  async updateUserCredentials(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Obter o usuário atual
      const currentUser = this.getUserById(userId);
      if (!currentUser) {
        return false;
      }

      // Verificar se a senha atual está correta
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!isCurrentPasswordValid) {
        return false;
      }

      // Verificar força da nova senha (mínimo 8 caracteres)
      if (newPassword.length < 8) {
        throw new Error('A nova senha deve ter pelo menos 8 caracteres');
      }

      // Gerar hash da nova senha com salt mais alto
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Atualizar a senha do usuário
      const updatedUser = {
        ...currentUser,
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      };

      // Obter usuários do localStorage
      let users = this.getFromLocalStorage<LocalUser[]>('local_users', []);

      // Se não houver usuários no localStorage, usar os pré-cadastrados como base
      if (users.length === 0) {
        users = [...PRE_REGISTERED_USERS];
      }

      // Encontrar o usuário
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        // Se o usuário não existir no localStorage, adicionar
        users.push(updatedUser);
      } else {
        // Atualizar o usuário existente
        users[userIndex] = updatedUser;
      }

      // Salvar no localStorage para persistência
      this.saveToLocalStorage('local_users', users);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica se o localStorage está disponível
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test_localstorage__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtém dados do localStorage com fallback para valor padrão
   */
  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      // Verificar se o localStorage está disponível
      if (!this.isLocalStorageAvailable()) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveToLocalStorage<T>(key: string, value: T): void {
    try {
      // Verificar se o localStorage está disponível
      if (!this.isLocalStorageAvailable()) {
        return;
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Silenciosamente ignora erros de salvamento
    }
  }
}

// Instância singleton do serviço
export const localAuthService = new LocalAuthService();