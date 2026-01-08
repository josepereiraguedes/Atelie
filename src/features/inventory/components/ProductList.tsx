
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Edit, Brain, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '@/shared/types/database.types';
import { ProductCardSkeleton } from '@/shared/components';
import { communicationService } from '@/features/crm/services/communicationService';
import toast from 'react-hot-toast';
import { useConfig } from '@/core/contexts/ConfigContext';

interface ProductListProps {
  isLoading: boolean;
  filteredProducts: Product[];
  selectedProducts: number[];
  onToggleSelection: (id: number) => void;
  onQuickStockUpdate: (product: Product, delta: number) => void;
  onDeleteProduct: (id: number, name: string) => void;
  onOpenSpyModal: (data: { name: string, price: number }) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  isLoading,
  filteredProducts,
  selectedProducts,
  onToggleSelection,
  onQuickStockUpdate,
  onDeleteProduct,
  onOpenSpyModal
}) => {
  const { company } = useConfig();

  const isLowStock = (product: Product) => {
    return Number(product.quantity) <= Number(product.min_stock);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return <div className="text-center py-12 text-gray-400">Nenhum produto encontrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {filteredProducts.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.05, 0.5) }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group"
        >
          <div className="relative">
            <div className="absolute top-2 left-2 z-10 w-full flex justify-between px-2">
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id!)}
                onChange={() => onToggleSelection(product.id!)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shadow-sm cursor-pointer"
              />
              {isLowStock(product) && <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Baixo Estoque</div>}
            </div>

            <div className="w-full h-40 bg-white p-4 flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <Package className="w-12 h-12 text-gray-300" />
              )}
            </div>
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-700">
            <div className="mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm" title={product.name}>{product.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono truncate">{product.sku || 'Sem SKU'}</p>
            </div>

            <div className="flex items-end justify-between text-xs mb-3">
              <div>
                <span className="text-gray-500 block mb-0.5">Estoque</span>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md">
                  <button onClick={() => onQuickStockUpdate(product, -1)} className="p-1 hover:text-red-500 transition-colors disabled:opacity-30" disabled={(product.quantity || 0) <= 0}>-</button>
                  <span className={`font-bold w-6 text-center ${(product.quantity || 0) <= (product.min_stock || 0) ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{product.quantity || 0}</span>
                  <button onClick={() => onQuickStockUpdate(product, 1)} className="p-1 hover:text-green-500 transition-colors">+</button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block mb-0.5">Venda</span>
                <span className="font-bold text-green-600 text-sm">R$ {Number(product.sale_price).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Link to={`/inventory/edit/${product.id}`} className="flex-1 flex items-center justify-center p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-[10px] font-black uppercase transition-colors">
                <Edit className="w-3 h-3 mr-1" /> Editar
              </Link>
              <button
                onClick={() => onOpenSpyModal({ name: product.name, price: Number(product.sale_price) })}
                className="flex-1 flex items-center justify-center p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded text-[10px] font-black uppercase transition-colors"
                title="Análise de Mercado"
              >
                <Brain className="w-3 h-3 mr-1" /> Market IA
              </button>
              <button
                onClick={() => {
                  const templateData = {
                    product: product.name,
                    price: product.sale_price,
                    image: product.image,
                    description: product.description,
                    stock: product.quantity
                  };
                  const msg = communicationService.getTemplate('oferta', templateData, company.name);
                  communicationService.openWhatsApp('', msg, templateData, true, company.name);
                  toast.success('Pronto! Dê Ctrl+V e Enter no WhatsApp para enviar o anúncio.', { duration: 6000, icon: '🚀' });
                }}
                className="flex-1 flex items-center justify-center p-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded text-[10px] font-black uppercase transition-colors"
              >
                <ShoppingCart className="w-3 h-3 mr-1" /> Oferta
              </button>
              <button onClick={() => onDeleteProduct(product.id!, product.name)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Excluir">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const ProductListMemo = memo(ProductList);