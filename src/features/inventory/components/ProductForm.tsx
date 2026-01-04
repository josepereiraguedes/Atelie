
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Box,
  DollarSign,
  BarChart3,
  Upload,
  X,
  Scan,
  Plus,
  Package,
  Trash2,
  List,
  AlertCircle
} from 'lucide-react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { apiService } from '@/shared/services/api';
import { handleError } from '@/shared/utils/errorHandler';
import toast from 'react-hot-toast';
import { useFormValidation, validationRules } from '@/shared/hooks/useFormValidation';

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addProduct, updateProduct, products, categories } = useLocalDatabase();
  const isEditing = Boolean(id);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory'>('basic');
  const { errors, validateForm, clearErrors } = useFormValidation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    subcategory: '',
    supplier: '',
    image: '',
    images: [] as string[], // Galeria de imagens
    cost: 0,
    sale_price: 0,
    quantity: 0,
    min_stock: 5,
    unit: 'un',
    technical_specs: [] as { name: string; value: string; }[] // Ficha Técnica
  });

  useEffect(() => {
    if (isEditing && id) {
      const product = products.find(p => p.id === Number(id));
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          sku: product.sku || '',
          barcode: product.barcode || '',
          category: product.category,
          subcategory: product.subcategory || '',
          supplier: product.supplier_id?.toString() || '',
          image: product.image || '',
          images: product.images || (product.image ? [product.image] : []),
          cost: product.cost,
          sale_price: product.sale_price,
          quantity: product.quantity,
          min_stock: product.min_stock || 5,
          unit: product.unit || 'un',
          technical_specs: product.technical_specs || []
        });
      } else {
        toast.error('Produto não encontrado');
        navigate('/inventory');
      }
    }
  }, [id, isEditing, products, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar erros anteriores
    clearErrors();

    // Definir regras de validação
    const validationRulesObj = {
      name: validationRules.fullName,
      sku: [
        { required: true, message: 'SKU é obrigatório' },
        { maxLength: 50, message: 'SKU deve ter no máximo 50 caracteres' }
      ],
      cost: [
        { required: true, message: 'Preço de custo é obrigatório' },
        {
          custom: (value: number) => value >= 0,
          message: 'Preço de custo deve ser maior ou igual a zero'
        }
      ],
      sale_price: [
        { required: true, message: 'Preço de venda é obrigatório' },
        {
          custom: (value: number) => value >= 0,
          message: 'Preço de venda deve ser maior ou igual a zero'
        }
      ],
      quantity: [
        { required: true, message: 'Quantidade é obrigatória' },
        {
          custom: (value: number) => value >= 0,
          message: 'Quantidade deve ser maior ou igual a zero'
        }
      ]
    };

    // Validar formulário
    const isValid = validateForm(formData, validationRulesObj);

    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const productData = {
        ...formData,
        supplier_id: formData.supplier ? Number(formData.supplier) : undefined,
        images: formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : [])
      };

      if (isEditing && id) {
        await updateProduct(Number(id), productData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addProduct(productData);
        toast.success('Produto criado com sucesso!');
      }
      navigate('/inventory');
    } catch (error) {
      handleError(error, 'productForm');
      toast.error('Erro ao salvar produto');
    }
  };

  // Função auxiliar para atualizar galeria
  const updateImages = (newImages: string[]) => {
    const newMain = newImages.length > 0 ? newImages[0] : '';
    setFormData(prev => ({ ...prev, images: newImages, image: newMain }));
  };

  // Função para lidar com upload de arquivo local
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho (ex: 5MB)
    if (!file.type.startsWith('image/')) {
      toast.error('O arquivo deve ser uma imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const loadingToast = toast.loading('Enviando imagem para o servidor local...');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Usa o apiService para fazer o upload
        const result = await apiService.uploadImage(base64, file.name, 'products');

        const currentImages = formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []);
        updateImages([...currentImages, result.url]);

        toast.dismiss(loadingToast);
        toast.success('Imagem salva localmente!');
      };
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Falha no upload local');
      console.error(error);
    }
  };

  // Função para gerenciar specs
  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      technical_specs: [...prev.technical_specs, { name: '', value: '' }]
    }));
  };

  const removeSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technical_specs: prev.technical_specs.filter((_, i) => i !== index)
    }));
  };

  const updateSpec = (index: number, field: 'name' | 'value', value: string) => {
    const newSpecs = [...formData.technical_specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setFormData(prev => ({ ...prev, technical_specs: newSpecs }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <nav className="flex gap-1 px-4 min-w-max">
            {[
              { id: 'basic', label: 'Informações Básicas', icon: Box },
              { id: 'pricing', label: 'Precificação', icon: DollarSign },
              { id: 'inventory', label: 'Estoque', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-6">
                  {/* Nome e Descrição */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Ex: Smartphone Samsung Galaxy S23"
                      />
                      {errors.name && (
                        <div className="mt-1 flex items-center text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.sku && (
                          <div className="mt-1 flex items-center text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.sku[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button type="button" className="p-2 text-gray-500 hover:text-blue-600 border rounded-lg"><Scan className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Ficha Técnica */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <List className="w-4 h-4" /> Ficha Técnica
                      </h3>
                      <button
                        type="button"
                        onClick={addSpec}
                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>
                    <div className="p-4 bg-white space-y-2">
                      {formData.technical_specs.length > 0 ? (
                        formData.technical_specs.map((spec, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Característica (ex: Cor)"
                              value={spec.name}
                              onChange={(e) => updateSpec(index, 'name', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Valor (ex: Preto)"
                              value={spec.value}
                              onChange={(e) => updateSpec(index, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeSpec(index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              tabIndex={-1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          Nenhuma especificação técnica.<br />Adicione manualmente ou importe do Mercado Livre.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Galeria de Imagens</label>

                    {/* Imagem Principal */}
                    <div className="border-2 border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center relative bg-white overflow-hidden mb-3">
                      {(formData.images && formData.images.length > 0) || formData.image ? (
                        <img
                          src={formData.images && formData.images.length > 0 ? formData.images[0] : formData.image}
                          alt="Principal"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-center p-4 text-gray-400">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Sem imagem principal</p>
                        </div>
                      )}
                    </div>

                    {/* Grid de Miniaturas */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {(formData.images || (formData.image ? [formData.image] : [])).map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormData(prev => ({ ...prev, image: img }))}
                          className={`relative aspect-square border-2 rounded-lg overflow-hidden group bg-white shadow-sm cursor-pointer transition-all ${formData.image === img ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <img src={img} className="w-full h-full object-cover" />
                          {formData.image === img && (
                            <div className="absolute top-0 left-0 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-br uppercase shadow-sm">Principal</div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImages = formData.images.filter((_, i) => i !== idx);
                              updateImages(newImages);
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remover"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Cole a URL da imagem:');
                          if (url) {
                            const current = formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []);
                            updateImages([...current, url]);
                          }
                        }}
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-500"
                        title="Adicionar URL"
                      >
                        <Plus className="w-6 h-6" />
                      </button>

                      {/* Botão de Upload Local */}
                      <label className="aspect-square border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-400 hover:text-blue-600 cursor-pointer">
                        <Upload className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1 uppercase">Arquivo</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {/* Input Manual para Principal */}
                    <input
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const current = formData.images.length > 0 ? formData.images : [];
                        let newImages = [...current];
                        if (newImages.length > 0) newImages[0] = val;
                        else newImages = [val];
                        setFormData(prev => ({ ...prev, image: val, images: newImages }));
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded mb-2 text-gray-500"
                      placeholder="URL da imagem principal..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="l">Litro (l)</option>
                      <option value="cx">Caixa (cx)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className={`w-full px-4 py-2 border rounded-lg group hover:border-blue-500 focus:ring-2 ${errors.cost ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.cost && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cost[0]}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price || ''}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className={`w-full text-xl font-bold bg-white px-4 py-2 border rounded-lg ${errors.sale_price ? 'border-red-500 text-red-600' : 'border-blue-300 text-blue-600'}`}
                  />
                  {errors.sale_price && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.sale_price[0]}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <label className="block text-sm font-medium text-green-900 mb-1">Lucro Estimado</label>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {formData.sale_price > 0
                      ? ((formData.sale_price - formData.cost) / formData.sale_price * 100).toFixed(1) + '%'
                      : '0%'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                  <input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : 0 })}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.quantity && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.quantity[0]}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.min_stock || ''}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="hidden">
              <button type="submit"></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;


