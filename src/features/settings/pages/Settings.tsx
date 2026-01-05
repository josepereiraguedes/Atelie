import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, Palette, User, Database, Download, Info, Key, Bell, ShoppingCart, TrendingUp, BarChart3, Trash2 } from 'lucide-react';
import { useConfig } from '@/core/contexts/ConfigContext';
import { useTheme } from '@/core/contexts/ThemeContext';
import { useAuth } from '@/core/contexts/AuthContext';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { motion, HTMLMotionProps } from 'framer-motion';
import toast from 'react-hot-toast';

import DataExportImport from '@/shared/components/settings/DataExportImport';
import { MarketplaceConfigSummary } from '@/features/marketplace/components';
import { MercadoLivreConfigForm } from '@/features/settings/components/MercadoLivreConfigForm';

const Settings: React.FC = () => {
  const { company, updateCompany, notifications, updateNotifications } = useConfig();
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, updateUserCredentials } = useAuth();
  const { marketplaceConfigs } = useLocalDatabase(); // Apenas marketplaceConfigs é usado no componente
  const [formData, setFormData] = useState({
    name: company.name,
    logo: company.logo || '',
    showLogo: company.hasOwnProperty('showLogo') ? company.showLogo : true
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatar_url || ''
  });
  const [credentialsData, setCredentialsData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  // Adicionando estado para o e-mail
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmNewEmail: ''
  });
  // Estado para as notificações
  const [notificationData, setNotificationData] = useState({
    lowStockAlerts: notifications.lowStockAlerts,
    toastNotifications: notifications.toastNotifications,
    dashboardAlerts: notifications.dashboardAlerts
  });

  // useEffect para carregar dados iniciais de configurações, se necessário
  // As configurações são gerenciadas pelo ConfigContext
  useEffect(() => {
    // Configurações específicas da empresa já estão disponíveis via useConfig
    // Configurações de notificação também estão disponíveis via useConfig
  }, [company, notifications, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany({
      name: formData.name,
      logo: formData.logo || undefined, // Garantir que seja undefined se vazio
      showLogo: formData.showLogo
    });
    toast.success('Configurações salvas com sucesso!');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await updateUser(user.id, { 
          name: profileData.name,
          avatar_url: profileData.avatarUrl
        });
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Função para atualizar o e-mail e senha juntos
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let success = true;
      const messages: string[] = [];

      // Verificar se há alteração de e-mail
      const hasEmailChange = emailData.newEmail.trim() !== '';
      const hasPasswordChange = credentialsData.newPassword.trim() !== '';

      // Validar e atualizar e-mail se houver alteração
      if (hasEmailChange) {
        // Verificar se os e-mails coincidem
        if (emailData.newEmail !== emailData.confirmNewEmail) {
          toast.error('Os novos e-mails não coincidem!');
          return;
        }

        // Verificar se o novo e-mail é válido
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.newEmail)) {
          toast.error('Por favor, insira um e-mail válido!');
          return;
        }

        // Atualizar o e-mail do usuário
        if (user) {
          await updateUser(user.id, { 
            email: emailData.newEmail
          });
          messages.push('E-mail atualizado com sucesso!');
        }
      }

      // Validar e atualizar senha se houver alteração
      if (hasPasswordChange) {
        // Verificar se as senhas coincidem
        if (credentialsData.newPassword !== credentialsData.confirmNewPassword) {
          toast.error('As novas senhas não coincidem!');
          return;
        }

        // Verificar se a nova senha tem pelo menos 4 caracteres
        if (credentialsData.newPassword.length < 4) {
          toast.error('A nova senha deve ter pelo menos 4 caracteres!');
          return;
        }

        // Atualizar as credenciais do usuário
        if (user) {
          success = await updateUserCredentials(user.id, credentialsData.currentPassword, credentialsData.newPassword);
          
          if (success) {
            messages.push('Senha atualizada com sucesso!');
          } else {
            toast.error('Senha atual incorreta!');
            return;
          }
        }
      }

      // Mostrar mensagem de sucesso se houve alguma alteração
      if (hasEmailChange || hasPasswordChange) {
        if (messages.length > 0) {
          toast.success(messages.join(' '));
          
          // Limpar os campos
          setCredentialsData({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          });
          setEmailData({
            newEmail: '',
            confirmNewEmail: ''
          });
        }
      } else {
        toast.success('Nenhuma alteração foi feita.');
      }
    } catch (error) {
      toast.error('Erro ao atualizar credenciais');
      console.error('Erro ao atualizar credenciais:', error);
    }
  };

  // Função para atualizar as notificações
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotifications(notificationData);
    toast.success('Configurações de notificação salvas com sucesso!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileData(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '', showLogo: false }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Versão 1.0.0
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil do Usuário e Empresa */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                Perfil e Empresa
              </h2>
            </div>

            <div className="space-y-6">
              {/* Perfil do Usuário */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Perfil do Usuário
                </h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {profileData.avatarUrl ? (
                        <img 
                          className="h-12 w-12 rounded-full object-cover" 
                          src={profileData.avatarUrl} 
                          alt="Avatar" 
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-12 h-12" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Foto
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-mail Atual
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar Perfil
                  </button>
                </form>
              </div>

              {/* Informações da Empresa */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Informações da Empresa
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Logo
                    </label>
                    <div className="flex items-center space-x-3">
                      {formData.logo && (
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="w-10 h-10 object-contain border border-gray-300 rounded-lg"
                        />
                      )}
                      <div className="flex space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload-company"
                        />
                        <label
                          htmlFor="logo-upload-company"
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Logo
                        </label>
                        
                        {formData.logo && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.logo && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="show-logo-toggle"
                        checked={formData.showLogo}
                        onChange={(e) => setFormData(prev => ({ ...prev, showLogo: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="show-logo-toggle" className="ml-2 block text-sm text-gray-900 dark:text-white">
                        Mostrar logo em vez do nome
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar Empresa
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Credenciais do Usuário e E-mail */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Key className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                Credenciais e E-mail
              </h2>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail Atual
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Novo E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite seu novo e-mail"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Novo E-mail
                </label>
                <input
                  type="email"
                  value={emailData.confirmNewEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, confirmNewEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirme seu novo e-mail"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha Atual (para confirmar alterações)
                </label>
                <input
                  type="password"
                  value={credentialsData.currentPassword}
                  onChange={(e) => setCredentialsData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nova Senha (opcional)
                </label>
                <input
                  type="password"
                  value={credentialsData.newPassword}
                  onChange={(e) => setCredentialsData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={credentialsData.confirmNewPassword}
                  onChange={(e) => setCredentialsData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Atualizar Credenciais
              </button>
            </form>
          </motion.div>
        )}

        {/* Notificações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Notificações
            </h2>
          </div>

          <form onSubmit={handleNotificationsSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Alertas de Estoque Baixo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Receber notificações quando o estoque estiver baixo
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="lowStockAlerts"
                  checked={notificationData.lowStockAlerts}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
                  className="sr-only"
                />
                <label
                  htmlFor="lowStockAlerts"
                  className={`block h-6 w-10 rounded-full cursor-pointer ${
                    notificationData.lowStockAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      notificationData.lowStockAlerts ? 'transform translate-x-4' : ''
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificações Toast
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Exibir notificações na tela
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="toastNotifications"
                  checked={notificationData.toastNotifications}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, toastNotifications: e.target.checked }))}
                  className="sr-only"
                />
                <label
                  htmlFor="toastNotifications"
                  className={`block h-6 w-10 rounded-full cursor-pointer ${
                    notificationData.toastNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      notificationData.toastNotifications ? 'transform translate-x-4' : ''
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Alertas no Dashboard
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Exibir alertas de estoque baixo no dashboard
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="dashboardAlerts"
                  checked={notificationData.dashboardAlerts}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, dashboardAlerts: e.target.checked }))}
                  className="sr-only"
                />
                <label
                  htmlFor="dashboardAlerts"
                  className={`block h-6 w-10 rounded-full cursor-pointer ${
                    notificationData.dashboardAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      notificationData.dashboardAlerts ? 'transform translate-x-4' : ''
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Salvar Notificações
            </button>
          </form>
        </motion.div>

        {/* Aparência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Aparência
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Tema do Sistema
                </h3>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Claro
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Escuro
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compartilhamento de Dados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Dados
            </h2>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Exporte e importe dados entre dispositivos</p>
          </div>
          
          <DataExportImport />
        </motion.div>
        
        {/* Configurações de Marketplace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Marketplaces
            </h2>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Configure as taxas e custos para cada marketplace onde você vende</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <a
              href="#/marketplace-settings"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building className="w-4 h-4 mr-1.5" />
              Configurar Marketplaces
            </a>
            <a
              href="#/product-pricing"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Precificar Produtos
            </a>
            <a
              href="#/marketplace-settings"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Gerenciar Marketplaces
            </a>
            <a
              href="#/marketplace-comparison"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Comparar Marketplaces
            </a>
            <a
              href="#/pricing-reports"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Relatórios de Precificação
            </a>
            <a
              href="#/price-sensitivity-analysis"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Análise de Sensibilidade
            </a>
            <a
              href="#/cost-comparison"
              className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Comparação de Custos
            </a>
          </div>
        </motion.div>
        
        {/* Configurações do Mercado Livre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Mercado Livre
            </h2>
          </div>
          
          <MercadoLivreConfigForm 
            onSave={(config) => {
              // Armazenar as configurações no localStorage
              localStorage.setItem('mercadoLivreConfig', JSON.stringify(config));
              toast.success('Credenciais do Mercado Livre salvas com sucesso!');
            }}
            currentConfig={
              localStorage.getItem('mercadoLivreConfig') 
                ? JSON.parse(localStorage.getItem('mercadoLivreConfig') as string) 
                : undefined
            }
          />
        </motion.div>
      </div>

      {/* Resumo de Configuração de Marketplaces */}
      <MarketplaceConfigSummary />

      {/* Informações do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
      >
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
            Informações do Sistema
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Modo</div>
            <div className="font-medium text-gray-900 dark:text-white mt-1">PWA</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Status</div>
            <div className="font-medium text-green-600 mt-1">Online</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Atualização</div>
            <div className="font-medium text-gray-900 dark:text-white mt-1">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Versão</div>
            <div className="font-medium text-gray-900 dark:text-white mt-1">1.0.0</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;


