import React, { useState, useEffect, memo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Upload, Edit3 } from 'lucide-react';

const UserProfile: React.FC = memo(() => {
  const { user, signOut, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [userName, setUserName] = useState(user?.name || 'Usuário');

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatar_url || '');
      setUserName(user.name || 'Usuário');
    }
  }, [user]);

  if (!user) return null;

  const userEmail = user.email || '';

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setAvatarUrl(result);
        
        try {
          await updateUser(user.id, { avatar_url: result });
        } catch (error) {
          console.error('Erro ao atualizar avatar:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [user, updateUser]);

  const handleSaveAvatar = useCallback(async () => {
    try {
      await updateUser(user.id, { avatar_url: avatarUrl });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
    }
  }, [user, avatarUrl, updateUser]);

  const handleSaveName = useCallback(async () => {
    try {
      await updateUser(user.id, { name: userName });
      setIsEditingName(false);
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
    }
  }, [user, userName, updateUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [signOut]);

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 relative">
          {avatarUrl ? (
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src={avatarUrl} 
              alt="Avatar" 
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          {isEditing && (
            <div className="absolute -bottom-1 -right-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer bg-blue-500 rounded-full p-1 w-5 h-5 flex items-center justify-center"
              >
                <Upload className="w-2.5 h-2.5 text-white" />
              </label>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userName}
              </p>
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {userEmail}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-1">
        {isEditing ? (
          <button
            onClick={handleSaveAvatar}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
          >
            Salvar Foto
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
          >
            Editar Foto
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
        >
          Sair
        </button>
      </div>
    </div>
  );
});

export default UserProfile;