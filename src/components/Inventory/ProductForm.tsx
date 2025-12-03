import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalDatabase, Product } from '../../contexts/LocalDatabaseContext';
import toast from 'react-hot-toast';
import { Upload, X, ChevronDown } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import FormField from '../common/FormField';
import { TextInput, NumberInput } from '../common/FormField';
import TextAreaField from '../common/TextAreaField';
import FormActions from '../common/FormActions';
import { useAppNavigation } from '../../hooks/useNavigation';
import { useFormHandler } from '../../hooks/useFormHandler';
import ErrorBoundary from '../common/ErrorBoundary';

interface ProductFormProps {
  product?: Product;
}

const ProductForm: React.FC<ProductFormProps> = ({ product }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const { products, categories, subcategories, suppliers, addProduct, updateProduct } = useLocalDatabase();
  const { goTo } = useAppNavigation();
  const { handleSubmit: handleFormSubmit, loading } = useFormHandler({
    successMessage: 'Produto salvo com sucesso!',
    errorMessage: 'Erro ao salvar produto'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    cost: 0,
    sale_price: 0,
    quantity: 0,
    min_stock: 0,
    image: '',
    supplier_id: 0,
    // Campos adicionais para marketplaces
    sku: '',
    barcode: '',
    brand: '',
    model: '',
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    description: '',
    marketplace_link: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // Para abas de informações

  // Obter categorias únicas do contexto
  const sortedCategories = useMemo(() => {
    return [...categories].sort();
  }, [categories]);

  // Obter subcategorias da categoria selecionada do contexto
  const categorySubcategories = useMemo(() => {
    if (!formData.category) return [];
    return (subcategories[formData.category] || []).sort();
  }, [subcategories, formData.category]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        subcategory: product.subcategory || '',
        cost: product.cost,
        sale_price: product.sale_price,
        quantity: product.quantity,
        min_stock: product.min_stock || 0,
        image: product.image || '',
        supplier_id: product.supplier_id || 0,
        // Campos adicionais para marketplaces
        sku: product.sku || '',
        barcode: product.barcode || '',
        brand: product.brand || '',
        model: product.model || '',
        weight: product.weight || 0,
        height: product.height || 0,
        width: product.width || 0,
        length: product.length || 0,
        description: product.description || '',
        marketplace_link: product.marketplace_link || ''
      });
      setImagePreview(product.image || null);
    } else if (id) {
      const existingProduct = products.find(p => p.id === parseInt(id));
      if (existingProduct) {
        setFormData({
          name: existingProduct.name,
          category: existingProduct.category,
          subcategory: existingProduct.subcategory || '',
          cost: existingProduct.cost,
          sale_price: existingProduct.sale_price,
          quantity: existingProduct.quantity,
          min_stock: existingProduct.min_stock || 0,
          image: existingProduct.image || '',
          supplier_id: existingProduct.supplier_id || 0,
          // Campos adicionais para marketplaces
          sku: existingProduct.sku || '',
          barcode: existingProduct.barcode || '',
          brand: existingProduct.brand || '',
          model: existingProduct.model || '',
          weight: existingProduct.weight || 0,
          height: existingProduct.height || 0,
          width: existingProduct.width || 0,
          length: existingProduct.length || 0,
          description: existingProduct.description || '',
          marketplace_link: existingProduct.marketplace_link || ''
        });
        setImagePreview(existingProduct.image || null);
      }
    }
  }, [product, id, products]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.match('image.*')) {
        toast.error('Por favor, selecione um arquivo de imagem válido');
        return;
      }
      
      // Verificar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, image: result });
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  }, [formData]);

  const removeImage = useCallback(() => {
    setFormData({ ...formData, image: '' });
    setImagePreview(null);
    // Limpar o input file
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para salvar um produto');
      return;
    }

    try {
      // Validar dados obrigatórios
      if (!formData.name.trim()) {
        toast.error('O nome do produto é obrigatório');
        return;
      }
      
      if (formData.cost < 0) {
        toast.error('O custo não pode ser negativo');
        return;
      }
      
      if (formData.sale_price < 0) {
        toast.error('O preço de venda não pode ser negativo');
        return;
      }
      
      if (formData.quantity < 0) {
        toast.error('A quantidade não pode ser negativa');
        return;
      }
      
      if (formData.min_stock < 0) {
        toast.error('O estoque mínimo não pode ser negativo');
        return;
      }

      await handleFormSubmit(async () => {
        if (product || id) {
          // Atualizar produto existente
          const productId = product?.id || parseInt(id || '0');
          return await updateProduct(productId, formData);
        } else {
          // Criar novo produto
          return await addProduct(formData);
        }
      });
      goTo('/inventory');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  }, [user, formData, product, id, handleFormSubmit, updateProduct, addProduct, goTo]);

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto">
        <PageHeader 
          title={product || id ? 'Editar Produto' : 'Novo Produto'} 
          backPath="/inventory"
        />
        
        {/* Abas para navegação entre seções */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Informações Básicas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dados para Marketplaces
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dimensions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dimensions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dimensões e Peso
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* Aba de Informações Básicas */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Seção de Imagem do Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagem do Produto
                </label>
                <div className="flex items-start space-x-4">
                  {/* Preview da Imagem */}
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Botão de Upload */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Escolher Imagem
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG ou GIF (máx. 2MB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <TextInput
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  placeholder="Nome do produto"
                  required
                />
              </div>
              
              {/* Dropdown de Categoria */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center"
                  >
                    <span>{formData.category || 'Selecione uma categoria'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.hash = '#/categories'}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    title="Gerenciar categorias"
                  >
                    +
                  </button>
                </div>
                
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: '', subcategory: '' });
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      Nenhuma categoria
                    </button>
                    {sortedCategories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: category.name, subcategory: '' });
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Dropdown de Subcategoria */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subcategoria
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                    disabled={!formData.category}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center disabled:opacity-50"
                  >
                    <span>{formData.subcategory || 'Selecione uma subcategoria'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSubcategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.hash = '#/categories'}
                    disabled={!formData.category}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    title="Gerenciar subcategorias"
                  >
                    +
                  </button>
                </div>
                
                {isSubcategoryDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, subcategory: '' });
                        setIsSubcategoryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      Nenhuma subcategoria
                    </button>
                    {categorySubcategories.map(subcategory => (
                      <button
                        key={subcategory}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, subcategory });
                          setIsSubcategoryDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custo (R$) *
                  </label>
                  <NumberInput
                    value={formData.cost}
                    onChange={(value) => setFormData({ ...formData, cost: value })}
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <NumberInput
                    value={formData.sale_price}
                    onChange={(value) => setFormData({ ...formData, sale_price: value })}
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade em Estoque *
                  </label>
                  <NumberInput
                    value={formData.quantity}
                    onChange={(value) => setFormData({ ...formData, quantity: value })}
                    min={0}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estoque Mínimo
                  </label>
                  <NumberInput
                    value={formData.min_stock}
                    onChange={(value) => setFormData({ ...formData, min_stock: value })}
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor
                </label>
                <select
                  value={formData.supplier_id || ''}
                  onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Aba de Dados para Marketplaces */}
          {activeTab === 'marketplace' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código de Barras
                  </label>
                  <TextInput
                    value={formData.barcode}
                    onChange={(value) => setFormData({ ...formData, barcode: value })}
                    placeholder="Código de barras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marca
                  </label>
                  <TextInput
                    value={formData.brand}
                    onChange={(value) => setFormData({ ...formData, brand: value })}
                    placeholder="Marca do produto"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modelo
                  </label>
                  <TextInput
                    value={formData.model}
                    onChange={(value) => setFormData({ ...formData, model: value })}
                    placeholder="Modelo do produto"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link no Marketplace
                </label>
                <TextInput
                  type="text"
                  value={formData.marketplace_link}
                  onChange={(value) => setFormData({ ...formData, marketplace_link: value })}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição Detalhada
                </label>
                <TextAreaField
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  rows={4}
                  placeholder="Descrição completa do produto para os marketplaces"
                />
              </div>
            </div>
          )}

          {/* Aba de Dimensões e Peso */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Peso (kg)
                  </label>
                  <NumberInput
                    value={formData.weight}
                    onChange={(value) => setFormData({ ...formData, weight: value })}
                    step="0.001"
                    min={0}
                    placeholder="0.000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Altura (cm)
                  </label>
                  <NumberInput
                    value={formData.height}
                    onChange={(value) => setFormData({ ...formData, height: value })}
                    step="0.1"
                    min={0}
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Largura (cm)
                  </label>
                  <NumberInput
                    value={formData.width}
                    onChange={(value) => setFormData({ ...formData, width: value })}
                    step="0.1"
                    min={0}
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comprimento (cm)
                  </label>
                  <NumberInput
                    value={formData.length}
                    onChange={(value) => setFormData({ ...formData, length: value })}
                    step="0.1"
                    min={0}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
          )}
          
          <FormActions
            cancelPath="/inventory"
            submitText="Salvar Produto"
            loading={loading}
          />
        </form>
      </div>
    </ErrorBoundary>
  );
};

export default ProductForm;