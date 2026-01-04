import React, { useState, useMemo } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';

interface CategoryManagerProps {
  onCategorySelect?: (category: string, subcategory?: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onCategorySelect
}) => {
  const { products, categories, subcategories } = useLocalDatabase();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const sortedCategories = useMemo(() => {
    return [...categories].sort();
  }, [categories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleSubcategoryClick = (category: string, subcategory: string) => {
    if (onCategorySelect) {
      onCategorySelect(category, subcategory);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Categorias</h3>
        <button 
          onClick={() => window.location.hash = '#/categories'}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          Gerenciar
        </button>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="text-center py-4">
          <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma categoria cadastrada
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {sortedCategories.map(category => (
            <div key={category.id}>
              <div 
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.name);
                    }}
                    className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {(subcategories[category.name] || []).length > 0 && (
                      expandedCategories.has(category.name) ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-gray-900 dark:text-white">{category.name}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    ({products.filter(p => p.category === category.name).length})
                  </span>
                </div>
              </div>

              {expandedCategories.has(category.name) && (subcategories[category.name] || []).length > 0 && (
                <div className="ml-6 space-y-1">
                  {(subcategories[category.name] || []).map(subcategory => (
                    <div 
                      key={subcategory}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ml-4"
                      onClick={() => handleSubcategoryClick(category.name, subcategory)}
                    >
                      <span className="text-gray-700 dark:text-gray-300">{subcategory}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({products.filter(p => p.category === category.name && p.subcategory === subcategory).length})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;