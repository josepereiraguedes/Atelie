import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Financial';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import ProductForm from './components/Inventory/ProductForm';
import TransactionForm from './components/Financial/TransactionForm';
import EditTransactionForm from './components/Financial/EditTransactionForm';
import Clients from './pages/Clients';
import ClientForm from './components/Clients/ClientForm';
import SupplierForm from './components/Purchasing/SupplierForm';
import PurchaseOrderForm from './components/Purchasing/PurchaseOrderForm';
import PurchaseQuoteForm from './components/Purchasing/PurchaseQuoteForm';
import GoodsReceiptForm from './components/Purchasing/GoodsReceiptForm';
import ClientQuoteForm from './components/ClientQuotes/ClientQuoteForm';
import ClientQuoteDetails from './components/ClientQuotes/ClientQuoteDetails';
import PurchaseReports from './pages/PurchaseReports';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import LoginForm from './components/Auth/LoginForm';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useDefaultShortcuts } from './hooks/useDefaultShortcuts';

import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseQuotes from './pages/PurchaseQuotes';
import GoodsReceipts from './pages/GoodsReceipts';
import ClientQuotes from './pages/ClientQuotes';
import MarketplaceSettings from './pages/MarketplaceSettings';
import ProductPricing from './pages/ProductPricing';
import MarketplaceComparison from './pages/MarketplaceComparison';
import PricingReports from './pages/PricingReports';
import PriceSensitivityAnalysisPage from './pages/PriceSensitivityAnalysisPage';
import CostComparisonPage from './pages/CostComparisonPage';
import ActionLog from './pages/ActionLog';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // Habilitar atalhos de teclado
  useDefaultShortcuts();

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/inventory" element={<Layout />}>
          <Route index element={<Inventory />} />
        </Route>
        <Route path="/inventory/new" element={<Layout />}>
          <Route index element={<ProductForm />} />
        </Route>
        <Route path="/inventory/edit/:id" element={<Layout />}>
          <Route index element={<ProductForm />} />
        </Route>
        <Route path="/categories" element={<Layout />}>
          <Route index element={<Categories />} />
        </Route>
        <Route path="/suppliers" element={<Layout />}>
          <Route index element={<Suppliers />} />
        </Route>
        <Route path="/suppliers/new" element={<Layout />}>
          <Route index element={<SupplierForm />} />
        </Route>
        <Route path="/suppliers/edit/:id" element={<Layout />}>
          <Route index element={<SupplierForm />} />
        </Route>
        <Route path="/purchase-orders" element={<Layout />}>
          <Route index element={<PurchaseOrders />} />
        </Route>
        <Route path="/purchase-orders/new" element={<Layout />}>
          <Route index element={<PurchaseOrderForm />} />
        </Route>
        <Route path="/purchase-orders/edit/:id" element={<Layout />}>
          <Route index element={<PurchaseOrderForm />} />
        </Route>
        <Route path="/purchase-quotes" element={<Layout />}>
          <Route index element={<PurchaseQuotes />} />
        </Route>
        <Route path="/purchase-quotes/new" element={<Layout />}>
          <Route index element={<PurchaseQuoteForm />} />
        </Route>
        <Route path="/purchase-quotes/edit/:id" element={<Layout />}>
          <Route index element={<PurchaseQuoteForm />} />
        </Route>
        <Route path="/client-quotes" element={<Layout />}>
          <Route index element={<ClientQuotes />} />
        </Route>
        <Route path="/client-quotes/new" element={<Layout />}>
          <Route index element={<ClientQuoteForm />} />
        </Route>
        <Route path="/client-quotes/edit/:id" element={<Layout />}>
          <Route index element={<ClientQuoteForm />} />
        </Route>
        <Route path="/client-quotes/details/:id" element={<Layout />}>
          <Route index element={<ClientQuoteDetails />} />
        </Route>
        <Route path="/goods-receipts" element={<Layout />}>
          <Route index element={<GoodsReceipts />} />
        </Route>
        <Route path="/goods-receipts/new" element={<Layout />}>
          <Route index element={<GoodsReceiptForm />} />
        </Route>
        <Route path="/goods-receipts/edit/:id" element={<Layout />}>
          <Route index element={<GoodsReceiptForm />} />
        </Route>
        <Route path="/purchase-reports" element={<Layout />}>
          <Route index element={<PurchaseReports />} />
        </Route>
        <Route path="/executive-dashboard" element={<Layout />}>
          <Route index element={<ExecutiveDashboard />} />
        </Route>
        <Route path="/sales" element={<Layout />}>
          <Route index element={<Sales />} />
        </Route>
        <Route path="/sales/new" element={<Layout />}>
          <Route index element={<TransactionForm />} />
        </Route>
        <Route path="/sales/edit/:id" element={<Layout />}>
          <Route index element={<EditTransactionForm />} />
        </Route>
        <Route path="/clients" element={<Layout />}>
          <Route index element={<Clients />} />
        </Route>
        <Route path="/clients/new" element={<Layout />}>
          <Route index element={<ClientForm />} />
        </Route>
        <Route path="/clients/edit/:id" element={<Layout />}>
          <Route index element={<ClientForm />} />
        </Route>
        <Route path="/reports" element={<Layout />}>
          <Route index element={<Reports />} />
        </Route>
        <Route path="/settings" element={<Layout />}>
          <Route index element={<Settings />} />
        </Route>
        <Route path="/marketplace-settings" element={<Layout />}>
          <Route index element={<MarketplaceSettings />} />
        </Route>
        <Route path="/product-pricing" element={<Layout />}>
          <Route index element={<ProductPricing />} />
        </Route>
        <Route path="/marketplace-comparison" element={<Layout />}>
          <Route index element={<MarketplaceComparison />} />
        </Route>
        <Route path="/pricing-reports" element={<Layout />}>
          <Route index element={<PricingReports />} />
        </Route>
        <Route path="/price-sensitivity-analysis" element={<Layout />}>
          <Route index element={<PriceSensitivityAnalysisPage />} />
        </Route>
        <Route path="/cost-comparison" element={<Layout />}>
          <Route index element={<CostComparisonPage />} />
        </Route>
        <Route path="/action-log" element={<Layout />}>
          <Route index element={<ActionLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default AppContent;