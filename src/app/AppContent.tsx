import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/shared/components/layout/Layout';

import { Inventory } from '@/features/inventory/pages';
import { Financial } from '@/features/financial/pages';
import { Reports } from '@/features/reports/pages';
import { Settings } from '@/features/settings/pages';
import { Categories } from '@/features/inventory/pages';
import { ProductForm } from '@/features/inventory/components';
import { TransactionForm } from '@/features/financial/components';
import { EditTransactionForm } from '@/features/financial/components';
import { Clients } from '@/features/crm/pages';
import { ClientForm } from '@/features/crm/components';
import { SupplierForm } from '@/features/purchasing/components';
import { PurchaseOrderForm } from '@/features/purchasing/components';
import { PurchaseQuoteForm } from '@/features/purchasing/components';
import { GoodsReceiptForm } from '@/features/purchasing/components';
import { ClientQuoteForm } from '@/features/crm/components';
import { ClientQuoteDetails } from '@/features/crm/components';
import { PurchaseReports } from '@/features/reports/pages';
import { ExecutiveDashboard } from '@/features/dashboard/pages';
import LoginForm from '@/features/auth/components/LoginForm';
import { InventoryMovementLog } from '@/features/inventory/pages';

import { useAuth } from '@/core/contexts/AuthContext';
import { ErrorBoundary } from '@/shared/components';
import { KeyboardShortcutsManager } from '@/shared/components';

import { Suppliers } from '@/features/purchasing/pages';
import { PurchaseOrders } from '@/features/purchasing/pages';
import { PurchaseQuotes } from '@/features/purchasing/pages';
import { GoodsReceipts } from '@/features/purchasing/pages';
import { ClientQuotes } from '@/features/crm/pages';
import { MarketplaceSettings } from '@/features/marketplace/pages';
import { ProductPricing } from '@/features/marketplace/pages';

import { PricingReports } from '@/features/reports/pages';
import { PriceSensitivityAnalysisPage } from '@/features/marketplace/pages';
import { CostComparisonPage } from '@/features/marketplace/pages';
import { ActionLog } from '@/features/settings/pages';
import { NFeImporter } from '@/features/inventory/components';
import { MigrationTool } from '@/features/settings/components';
import { POS } from '@/features/pos/pages';
import { Intelligence } from '@/features/intelligence/pages';
import { PDFCatalogImporter } from '@/features/inventory/components';
import { CustomerSuccess } from '@/features/crm/pages';
import { LabelGenerator } from '@/features/settings/pages';
import { InventoryAudit } from '@/features/inventory/pages';
import { LeadImport } from '@/features/crm/pages';

// Componente wrapper para as rotas principais
const AppRoutes: React.FC = () => {
  return (
    <>
      <KeyboardShortcutsManager />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ExecutiveDashboard />} />
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
          <Route path="/inventory/movement-log" element={<Layout />}>
            <Route index element={<InventoryMovementLog />} />
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

          <Route path="/financial" element={<Layout />}>
            <Route index element={<Financial />} />
          </Route>
          <Route path="/financial/new" element={<Layout />}>
            <Route index element={<TransactionForm />} />
          </Route>


          <Route path="/financial/edit/:id" element={<Layout />}>
            <Route index element={<EditTransactionForm />} />
          </Route>
          <Route path="/pos" element={<Layout />}>
            <Route index element={<POS />} />
          </Route>
          <Route path="/clients" element={<Layout />}>
            <Route index element={<Clients />} />
          </Route>
          <Route path="/customer-success" element={<Layout />}>
            <Route index element={<CustomerSuccess />} />
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
          <Route path="/import-nfe" element={<Layout />}>
            <Route index element={<NFeImporter />} />
          </Route>
          <Route path="/migration" element={<Layout />}>
            <Route index element={<MigrationTool />} />
          </Route>
          <Route path="/intelligence" element={<Layout />}>
            <Route index element={<Intelligence />} />
          </Route>
          <Route path="/import-pdf" element={<Layout />}>
            <Route index element={<PDFCatalogImporter />} />
          </Route>
          <Route path="/labels" element={<Layout />}>
            <Route index element={<LabelGenerator />} />
          </Route>
          <Route path="/inventory/audit" element={<Layout />}>
            <Route index element={<InventoryAudit />} />
          </Route>
          <Route path="/clients/import" element={<Layout />}>
            <Route index element={<LeadImport />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Forçar re-renderização quando o usuário mudar
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Inicializar serviços globais
  React.useEffect(() => {
    // Iniciar backup automático
    import('@/features/settings/services/autoBackup').then(({ autoBackupService }) => {
      autoBackupService.start();
    }).catch(err => console.error('Erro ao iniciar backup automático:', err));
  }, []);

  // Ouvir evento customizado de mudança de autenticação
  React.useEffect(() => {
    const handleAuthChange = () => {
      // Forçar uma atualização do componente quando o estado de autenticação mudar
      forceUpdate();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        {user ? (
          <Route path="*" element={<AppRoutes />} />
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
};

export default AppContent;