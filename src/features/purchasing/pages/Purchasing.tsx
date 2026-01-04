import React, { useState, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { Link } from 'react-router-dom';
import { ShoppingCart, Truck, FileText } from 'lucide-react';
import { PageHeader } from '@/shared/components';

const Purchasing: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compras" 
        description="Gerencie seus pedidos de compra, recebimentos e cotações de fornecedores."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/purchase-orders"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
        >
          <ShoppingCart className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Pedidos de Compra
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crie e gerencie seus pedidos de compra para fornecedores.
          </p>
        </Link>

        <Link
          to="/goods-receipts"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
        >
          <Truck className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Recebimento de Mercadorias
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registre e controle o recebimento de produtos dos seus pedidos.
          </p>
        </Link>

        <Link
          to="/purchase-quotes"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
        >
          <FileText className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Cotações de Compra
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie cotações de preços de diferentes fornecedores.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Purchasing;

