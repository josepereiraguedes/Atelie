import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserActionHistory } from './useUserActionHistory';

/**
 * Hook para rastrear navegações e registrar no histórico de ações
 */
export const useNavigationTracking = () => {
  const location = useLocation();
  const { recordAction } = useUserActionHistory();

  useEffect(() => {
    // Mapeamento de rotas para descrições amigáveis
    const routeDescriptions: Record<string, string> = {
      '/': 'Dashboard',
      '/inventory': 'Inventário',
      '/inventory/new': 'Novo Produto',
      '/inventory/edit/:id': 'Editar Produto',
      '/categories': 'Categorias',
      '/suppliers': 'Fornecedores',
      '/suppliers/new': 'Novo Fornecedor',
      '/suppliers/edit/:id': 'Editar Fornecedor',
      '/purchase-orders': 'Pedidos de Compra',
      '/purchase-orders/new': 'Novo Pedido de Compra',
      '/purchase-orders/edit/:id': 'Editar Pedido de Compra',
      '/purchase-quotes': 'Cotações de Compra',
      '/purchase-quotes/new': 'Nova Cotação de Compra',
      '/purchase-quotes/edit/:id': 'Editar Cotação de Compra',
      '/client-quotes': 'Cotações para Clientes',
      '/client-quotes/new': 'Nova Cotação para Cliente',
      '/client-quotes/edit/:id': 'Editar Cotação para Cliente',
      '/client-quotes/details/:id': 'Detalhes da Cotação para Cliente',
      '/goods-receipts': 'Recebimentos',
      '/goods-receipts/new': 'Novo Recebimento',
      '/goods-receipts/edit/:id': 'Editar Recebimento',
      '/purchase-reports': 'Relatórios de Compras',
      '/executive-dashboard': 'Dashboard Executivo',
      '/sales': 'Vendas',
      '/sales/new': 'Nova Venda',
      '/sales/edit/:id': 'Editar Venda',
      '/clients': 'Clientes',
      '/clients/new': 'Novo Cliente',
      '/clients/edit/:id': 'Editar Cliente',
      '/reports': 'Relatórios',
      '/settings': 'Configurações',
      '/marketplace-settings': 'Configurações de Marketplaces',
      '/product-pricing': 'Precificação de Produtos',
      '/marketplace-comparison': 'Comparação de Marketplaces',
      '/pricing-reports': 'Relatórios de Precificação',
      '/price-sensitivity-analysis': 'Análise de Sensibilidade de Preços',
      '/cost-comparison': 'Comparação de Custos',
      '/action-log': 'Histórico de Ações'
    };

    // Obter descrição da rota atual
    let description = 'Navegou para: Página desconhecida';
    const path = location.pathname;
    
    // Verificar se há uma descrição exata para a rota
    if (routeDescriptions[path]) {
      description = `Navegou para: ${routeDescriptions[path]}`;
    } else {
      // Tentar encontrar uma rota correspondente com parâmetros
      const matchingRoute = Object.keys(routeDescriptions).find(route => {
        // Converter a rota em uma expressão regular para comparar com parâmetros
        const routeRegex = new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`);
        return routeRegex.test(path);
      });
      
      if (matchingRoute) {
        description = `Navegou para: ${routeDescriptions[matchingRoute]}`;
      }
    }

    // Registrar a ação de navegação
    recordAction('navigation', description, { path });
  }, [location, recordAction]);
};