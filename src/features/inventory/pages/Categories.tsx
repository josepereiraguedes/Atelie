import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { motion, HTMLMotionProps } from 'framer-motion';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  const { products, categories, subcategories, addCategory, addSubcategory, updateCategory, updateSubcategory, deleteCategory, deleteSubcategory } = useLocalDatabase();
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{oldName: string, newName: string} | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{category: string, oldName: string, newName: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Por favor, insira um nome para a categoria');
      return;
    }

    try {
      await addCategory({ name: newCategory });
      toast.success(`Categoria "${newCategory}" adicionada com sucesso!`);
      setNewCategory('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar categoria');
      console.error('Erro ao adicionar categoria:', error);
    }
  };

  const handleAddSubcategory = async () => {
    if (!selectedCategory) {
      toast.error('Por favor, selecione uma categoria primeiro');
      return;
    }

    if (!newSubcategory.trim()) {
      toast.error('Por favor, insira um nome para a subcategoria');
      return;
    }

    try {
      await addSubcategory(selectedCategory, newSubcategory);
      toast.success(`Subcategoria "${newSubcategory}" adicionada com sucesso à categoria "${selectedCategory}"!`);
      setNewSubcategory('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar subcategoria');
      console.error('Erro ao adicionar subcategoria:', error);
    }
  };

  const handleRenameCategory = async () => {
    if (!editingCategory) return;

    // Encontrar a categoria pelo nome antigo
    const categoryToUpdate = categories.find(c => c.name === editingCategory.oldName);
    if (!categoryToUpdate) {
      toast.error('Categoria não encontrada');
      return;
    }

    try {
      await updateCategory(categoryToUpdate.id, { name: editingCategory.newName });
      toast.success(`Categoria renomeada de "${editingCategory.oldName}" para "${editingCategory.newName}"`);
      setEditingCategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao renomear categoria');
      console.error('Erro ao renomear categoria:', error);
    }
  };

  const handleRenameSubcategory = async () => {
    if (!editingSubcategory) return;

    try {
      await updateSubcategory(
        editingSubcategory.category, 
        editingSubcategory.oldName, 
        editingSubcategory.newName
      );
      toast.success(`Subcategoria renomeada de "${editingSubcategory.oldName}" para "${editingSubcategory.newName}"`);
      setEditingSubcategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao renomear subcategoria');
      console.error('Erro ao renomear subcategoria:', error);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    // Encontrar a categoria pelo nome
    const categoryToDelete = categories.find(c => c.name === categoryName);
    if (!categoryToDelete) {
      toast.error('Categoria não encontrada');
      return;
    }

    // Verificar se há produtos nesta categoria
    const productsInCategory = products.filter(p => p.category === categoryName);
    
    if (productsInCategory.length > 0) {
      toast.error(`Não é possível excluir a categoria "${categoryName}" pois existem ${productsInCategory.length} produtos associados a ela.`);
      return;
    }

    // Se não há produtos, podemos excluir a categoria
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success(`Categoria "${categoryName}" excluída com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir categoria');
      console.error('Erro ao excluir categoria:', error);
    }
  };

  const handleDeleteSubcategory = async (category: string, subcategory: string) => {
    // Verificar se há produtos nesta subcategoria
    const productsInSubcategory = products.filter(
      p => p.category === category && p.subcategory === subcategory
    );
    
    if (productsInSubcategory.length > 0) {
      toast.error(`Não é possível excluir a subcategoria "${subcategory}" pois existem ${productsInSubcategory.length} produtos associados a ela.`);
      return;
    }

    // Se não há produtos, podemos excluir a subcategoria
    try {
      await deleteSubcategory(category, subcategory);
      toast.success(`Subcategoria "${subcategory}" excluída com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir subcategoria');
      console.error('Erro ao excluir subcategoria:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Categorias e Subcategorias
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adicionar Nova Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Adicionar Nova Categoria
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Eletrônicos, Roupas, Alimentos"
              />
            </div>
            
            <button
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar Categoria
            </button>
          </div>
        </motion.div>

        {/* Adicionar Nova Subcategoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Adicionar Nova Subcategoria
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione uma categoria</option>
                {sortedCategories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Subcategoria
              </label>
              <input
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Smartphones, Camisetas, Lanches"
                disabled={!selectedCategory}
              />
            </div>
            
            <button
              onClick={handleAddSubcategory}
              disabled={!selectedCategory}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar Subcategoria
            </button>
          </div>
        </motion.div>
      </div>

      {/* Lista de Categorias e Subcategorias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        {...({ className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5" } as HTMLMotionProps<'div'>)}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Categorias e Subcategorias Existentes
        </h2>
        
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma categoria cadastrada ainda
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(category => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
                  {editingCategory?.oldName === category.name ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editingCategory.newName}
                        onChange={(e) => setEditingCategory(prev => prev ? {...prev, newName: e.target.value} : null)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Novo nome da categoria"
                        autoFocus
                      />
                      <button
                        onClick={handleRenameCategory}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({products.filter(p => p.category === category.name).length} produtos)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingCategory({oldName: category.name, newName: category.name})}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.name)}
                      className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                      disabled={products.filter(p => p.category === category.name).length > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {subcategories[category.name]?.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subcategorias:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(subcategories[category.name] || []).map(subcategory => (
                        <div 
                          key={subcategory} 
                          className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1.5"
                        >
                          {editingSubcategory?.category === category.name && editingSubcategory?.oldName === subcategory ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingSubcategory.newName}
                                onChange={(e) => setEditingSubcategory(prev => 
                                  prev ? {...prev, newName: e.target.value} : null
                                )}
                                className="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Novo nome"
                                autoFocus
                              />
                              <button
                                onClick={handleRenameSubcategory}
                                className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingSubcategory(null)}
                                className="px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {subcategory}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                ({products.filter(p => p.category === category.name && p.subcategory === subcategory).length})
                              </span>
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => setEditingSubcategory({
                                    category: category.name, 
                                    oldName: subcategory, 
                                    newName: subcategory
                                  })}
                                  className="p-0.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubcategory(category.name, subcategory)}
                                  className="p-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                                  disabled={products.filter(p => p.category === category.name && p.subcategory === subcategory).length > 0}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Categories;
