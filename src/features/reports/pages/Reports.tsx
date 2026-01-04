import React, { useState, useMemo, useEffect } from 'react';
import { useLocalDatabase } from '@/core/contexts/LocalDatabaseContext';
import { handleError } from '@/shared/utils/errorHandler';
import { motion, HTMLMotionProps } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Download, TrendingUp, Package, Receipt, Edit, DollarSign } from 'lucide-react';

const Reports: React.FC = () => {
  const { products, transactions } = useLocalDatabase();
  const [selectedReport, setSelectedReport] = useState<'sales' | 'inventory'>('sales');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setHours(0, 0, 0, 0)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month' | 'custom'>('day');

  // Efeito para atualizar as datas com base no filtro de período
  useEffect(() => {
    if (periodFilter === 'custom') return;

    const today = new Date();
    let start, end;

    switch (periodFilter) {
      case 'day':
        start = format(today, 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        const weekStart = new Date(today);
        // Ajustar para começar na segunda-feira (1) em vez de domingo (0)
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        start = format(weekStart, 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = format(monthStart, 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      default:
        const defaultStart = subMonths(today, 1);
        start = format(defaultStart, 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
    }

    // console.log('Atualizando dateRange:', { start, end, periodFilter });
    setDateRange({ start, end });
  }, [periodFilter]);

  const generateSalesReport = useMemo(() => {
    return () => {
      // Filtrar transações pelo período selecionado
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Início do dia
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Final do dia

      // Debug
      console.log('Filtrando transações:', { startDate, endDate, dateRange });
      console.log('Transações totais:', transactions.length);

      // Verificar se há transações antes de filtrar
      if (transactions.length === 0) {
        console.log('Nenhuma transação encontrada');
        return [];
      }

      const sales = transactions.filter(t => {
        // Verificar se a transação tem data
        if (!t.created_at) {
          // console.log('Transação sem data:', t);
          return false;
        }

        const transactionDate = new Date(t.created_at);
        const isInRange = transactionDate >= startDate && transactionDate <= endDate;

        return t.type === 'sale' && isInRange;
      });

      // Agrupar vendas por produto (considerando transações com múltiplos itens)
      const salesByProduct = sales.reduce((acc, sale) => {
        // Para transações com múltiplos itens
        if (sale.items && sale.items.length > 0) {
          sale.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);

            if (!product) return;

            if (!acc[item.product_id]) {
              acc[item.product_id] = {
                name: product.name,
                category: product.category,
                quantity: 0,
                revenue: 0,
                cost: 0,
                profit: 0
              };
            }

            const itemCost = item.quantity * (product.cost || 0);
            acc[item.product_id].quantity += item.quantity;
            acc[item.product_id].revenue += item.total || 0;
            acc[item.product_id].cost += itemCost;
            acc[item.product_id].profit = acc[item.product_id].revenue - acc[item.product_id].cost;
          });
        }
        // Para transações com item único (compatibilidade com versão anterior)
        else if (sale.product_id !== undefined) {
          const productId = sale.product_id;
          const product = products.find(p => p.id === productId);

          if (!product) return acc;

          if (!acc[productId]) {
            acc[productId] = {
              name: product.name,
              category: product.category,
              quantity: 0,
              revenue: 0,
              cost: 0,
              profit: 0
            };
          }

          const saleCost = (sale.quantity || 0) * (product.cost || 0);
          acc[productId].quantity += (sale.quantity || 0);
          acc[productId].revenue += sale.total || 0;
          acc[productId].cost += saleCost;
          acc[productId].profit = acc[productId].revenue - acc[productId].cost;
        }

        return acc;
      }, {} as Record<number, { name: string, category: string, quantity: number, revenue: number, cost: number, profit: number }>);

      return Object.values(salesByProduct);
    };
  }, [transactions, products, dateRange]);

  const generateInventoryReport = useMemo(() => {
    return () => {
      return products.map(product => {
        const minStock = product.min_stock || 0;
        const currentStock = Number(product.quantity) || 0;
        const price = Number(product.sale_price) || 0;
        const stockValue = currentStock * price;

        return {
          name: product.name,
          category: product.category,
          currentStock: currentStock,
          minStock: minStock,
          stockValue: stockValue,
          status: currentStock <= minStock ? 'Baixo' : 'Normal'
        };
      });
    };
  }, [products]);

  const currentReportData = useMemo(() => {
    const data = selectedReport === 'sales' ? generateSalesReport() : generateInventoryReport();
    // console.log('currentReportData:', { selectedReport, data });
    return data;
  }, [selectedReport, generateSalesReport, generateInventoryReport]);

  // Função corrigida para obter dados reais de vendas mensais
  const getMonthlySalesData = useMemo(() => {
    return () => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Filtrar transações pelo período selecionado
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Início do dia
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      // Agrupar vendas por mês (considerando transações com múltiplos itens)
      const monthlySales: Record<string, { name: string; sales: number }> = {};

      // Verificar se há transações antes de filtrar
      if (transactions.length === 0) {
        // console.log('Nenhuma transação encontrada');
        return [] as Array<{ name: string; sales: number }>;
      }

      const filteredTransactions = transactions.filter(t => {
        // Verificar se a transação tem data
        if (!t.created_at) {
          // console.log('Transação sem data:', t);
          return false;
        }

        const transactionDate = new Date(t.created_at);
        const isInRange = transactionDate >= startDate && transactionDate <= endDate;

        return t.type === 'sale' && t.payment_status === 'paid' && isInRange;
      });

      filteredTransactions
        .forEach(transaction => {
          const date = new Date(transaction.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const monthName = months[date.getMonth()];

          if (!monthlySales[monthKey]) {
            monthlySales[monthKey] = { name: monthName, sales: 0 };
          }

          // Para transações com múltiplos itens, somar o total de cada item
          if (transaction.items && transaction.items.length > 0) {
            const total = transaction.items.reduce((sum, item) => sum + item.total, 0);
            monthlySales[monthKey].sales += total;
          } else {
            // Para transações com item único (compatibilidade com versão anterior)
            monthlySales[monthKey].sales += transaction.total;
          }
        });

      // Converter para array ordenado
      // console.log('Vendas mensais:', monthlySales);
      return Object.values(monthlySales);
    };
  }, [transactions, dateRange]);

  const monthlySalesData = useMemo(() => {
    const data = getMonthlySalesData();
    // console.log('monthlySalesData:', data);
    return data;
  }, [getMonthlySalesData]);



  const exportToPDF = () => {
    try {
      // Implementação alternativa: exportar como HTML e imprimir
      const title = selectedReport === 'sales' ? 'Relatório de Vendas' : 'Relatório de Estoque';
      const period = `Período: ${format(new Date(dateRange.start), 'P', { locale: ptBR })} a ${format(new Date(dateRange.end), 'P', { locale: ptBR })}`;

      // Criar conteúdo HTML para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Permita popups para imprimir');
        return;
      }

      // Estilo CSS para impressão
      const printCSS = `
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        h2 { font-size: 14px; font-weight: normal; margin-bottom: 20px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        @media print { .no-print { display: none; } }
      `;

      // Construir tabela HTML
      let tableHTML = '<table><thead><tr>';

      // Cabeçalhos
      const headers = selectedReport === 'sales'
        ? ['Produto', 'Categoria', 'Qtd Vendida', 'Receita (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)']
        : ['Produto', 'Categoria', 'Estoque', 'Status', 'Valor Custo (R$)'];

      headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
      });
      tableHTML += '</tr></thead><tbody>';

      // Linhas de dados
      currentReportData.forEach(item => {
        tableHTML += '<tr>';
        if (selectedReport === 'sales') {
          const saleItem = item as { name: string, category: string, quantity: number, revenue: number, cost: number, profit: number };
          const margin = saleItem.revenue > 0 ? (saleItem.profit / saleItem.revenue) * 100 : 0;
          tableHTML += `<td>${saleItem.name}</td>`;
          tableHTML += `<td>${saleItem.category}</td>`;
          tableHTML += `<td>${saleItem.quantity}</td>`;
          tableHTML += `<td>R$ ${(saleItem.revenue || 0).toFixed(2)}</td>`;
          tableHTML += `<td>R$ ${(saleItem.cost || 0).toFixed(2)}</td>`;
          tableHTML += `<td>R$ ${(saleItem.profit || 0).toFixed(2)}</td>`;
          tableHTML += `<td>${(margin || 0).toFixed(1)}%</td>`;
        } else {
          const inventoryItem = item as { name: string, category: string, currentStock: number, status: string, stockValue: number };
          tableHTML += `<td>${inventoryItem.name}</td>`;
          tableHTML += `<td>${inventoryItem.category}</td>`;
          tableHTML += `<td>${inventoryItem.currentStock}</td>`;
          tableHTML += `<td>${inventoryItem.status}</td>`;
          tableHTML += `<td>R$ ${(inventoryItem.stockValue || 0).toFixed(2)}</td>`;
        }
        tableHTML += '</tr>';
      });

      // Linha de totais para relatório de vendas
      if (selectedReport === 'sales') {
        const totalSales = (currentReportData as Array<{ revenue: number, cost: number, profit: number }>).reduce(
          (acc, item) => ({ revenue: acc.revenue + item.revenue, cost: acc.cost + item.cost, profit: acc.profit + item.profit }),
          { revenue: 0, cost: 0, profit: 0 }
        );
        const totalMargin = totalSales.revenue > 0 ? (totalSales.profit / totalSales.revenue) * 100 : 0;
        tableHTML += `<tr class="total-row"><td colspan="2">TOTAL</td><td></td><td>R$ ${totalSales.revenue.toFixed(2)}</td><td>R$ ${totalSales.cost.toFixed(2)}</td><td>R$ ${totalSales.profit.toFixed(2)}</td><td>${totalMargin.toFixed(1)}%</td></tr>`;
      }

      tableHTML += '</tbody></table>';

      // Adicionar tabela de detalhamento de transações para relatório de vendas
      if (selectedReport === 'sales') {
        // Filtrar transações de venda pelo período selecionado
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        const salesTransactions = transactions.filter(t =>
          t.type === 'sale' &&
          new Date(t.created_at) >= startDate &&
          new Date(t.created_at) <= endDate
        );

        if (salesTransactions.length > 0) {
          tableHTML += '<h2 style="margin-top: 30px; font-size: 16px;">Detalhamento de Transações</h2>';
          tableHTML += '<table><thead><tr>';
          tableHTML += '<th>Data</th><th>Produto</th><th>Qtd</th><th>Receita (R$)</th><th>Custo (R$)</th><th>Lucro (R$)</th><th>Margem (%)</th><th>Status</th>';
          tableHTML += '</tr></thead><tbody>';

          // Processar transações com múltiplos itens
          salesTransactions.forEach(transaction => {
            // Para transações com múltiplos itens
            if (transaction.items && transaction.items.length > 0) {
              transaction.items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                  const itemCost = item.quantity * product.cost;
                  const itemProfit = item.total - itemCost;
                  const itemMargin = item.total > 0 ? (itemProfit / item.total) * 100 : 0;

                  tableHTML += '<tr>';
                  tableHTML += `<td>${format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>`;
                  tableHTML += `<td>${product.name}</td>`;
                  tableHTML += `<td>${item.quantity}</td>`;
                  tableHTML += `<td>R$ ${item.total.toFixed(2)}</td>`;
                  tableHTML += `<td>R$ ${itemCost.toFixed(2)}</td>`;
                  tableHTML += `<td>R$ ${itemProfit.toFixed(2)}</td>`;
                  tableHTML += `<td>${itemMargin.toFixed(1)}%</td>`;
                  tableHTML += `<td>${transaction.payment_status === 'paid' ? 'Pago' : 'Pendente'}</td>`;
                  tableHTML += '</tr>';
                }
              });
            }
            // Para transações com item único (compatibilidade com versão anterior)
            else {
              const product = products.find(p => p.id === transaction.product_id);
              if (product) {
                const transactionCost = (transaction.quantity || 0) * product.cost;
                const transactionProfit = transaction.total - transactionCost;
                const transactionMargin = transaction.total > 0 ? (transactionProfit / transaction.total) * 100 : 0;

                tableHTML += '<tr>';
                tableHTML += `<td>${format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>`;
                tableHTML += `<td>${product.name}</td>`;
                tableHTML += `<td>${transaction.quantity || 0}</td>`;
                tableHTML += `<td>R$ ${transaction.total.toFixed(2)}</td>`;
                tableHTML += `<td>R$ ${transactionCost.toFixed(2)}</td>`;
                tableHTML += `<td>R$ ${transactionProfit.toFixed(2)}</td>`;
                tableHTML += `<td>${transactionMargin.toFixed(1)}%</td>`;
                tableHTML += `<td>${transaction.payment_status === 'paid' ? 'Pago' : 'Pendente'}</td>`;
                tableHTML += '</tr>';
              }
            }
          });

          tableHTML += '</tbody></table>';
        }
      }

      // Conteúdo completo da página
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>${printCSS}</style>
        </head>
        <body>
          <h1>${title}</h1>
          <h2>${period}</h2>
          ${tableHTML}
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print();" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Imprimir Relatório
            </button>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      toast.success('Relatório gerado!');

    } catch (error) {
      handleError(error, 'reportsPagePDF');
      toast.error('Erro ao gerar relatório');
    }
  };

  const exportToCSV = () => {
    try {
      // Implementação segura de exportação CSV sem dependências externas
      const csvContent = [];

      if (selectedReport === 'sales') {
        // Cabeçalhos para relatório de vendas
        csvContent.push(['Produto', 'Categoria', 'Qtd Vendida', 'Receita (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)'].join(','));

        // Dados agregados
        currentReportData.forEach(item => {
          const saleItem = item as { name: string, category: string, quantity: number, revenue: number, cost: number, profit: number };
          const margin = saleItem.revenue > 0 ? (saleItem.profit / saleItem.revenue) * 100 : 0;
          csvContent.push([
            `"${saleItem.name}"`,
            `"${saleItem.category}"`,
            saleItem.quantity,
            saleItem.revenue.toFixed(2),
            saleItem.cost.toFixed(2),
            saleItem.profit.toFixed(2),
            margin.toFixed(1)
          ].join(','));
        });

        // Linha de totais
        const totalSales = (currentReportData as Array<{ revenue: number, cost: number, profit: number }>).reduce(
          (acc, item) => ({ revenue: acc.revenue + item.revenue, cost: acc.cost + item.cost, profit: acc.profit + item.profit }),
          { revenue: 0, cost: 0, profit: 0 }
        );
        const totalMargin = totalSales.revenue > 0 ? (totalSales.profit / totalSales.revenue) * 100 : 0;
        csvContent.push([
          '"TOTAL"',
          '""',
          '""',
          totalSales.revenue.toFixed(2),
          totalSales.cost.toFixed(2),
          totalSales.profit.toFixed(2),
          totalMargin.toFixed(1)
        ].join(','));

        // Separador
        csvContent.push('');
        csvContent.push(['DETALHAMENTO DE TRANSAÇÕES'].join(','));
        csvContent.push([''].join(','));

        // Cabeçalhos do detalhamento
        csvContent.push(['Data', 'Produto', 'Qtd', 'Receita (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)', 'Status'].join(','));

        // Filtrar transações de venda pelo período selecionado
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        const salesTransactions = transactions.filter(t =>
          t.type === 'sale' &&
          new Date(t.created_at) >= startDate &&
          new Date(t.created_at) <= endDate
        );

        // Dados do detalhamento (considerando transações com múltiplos itens)
        salesTransactions.forEach(transaction => {
          // Para transações com múltiplos itens
          if (transaction.items && transaction.items.length > 0) {
            transaction.items.forEach(item => {
              const product = products.find(p => p.id === item.product_id);
              if (product) {
                const itemCost = item.quantity * product.cost;
                const itemProfit = item.total - itemCost;
                const itemMargin = item.total > 0 ? (itemProfit / item.total) * 100 : 0;

                csvContent.push([
                  `"${format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}"`,
                  `"${product.name}"`,
                  item.quantity,
                  item.total.toFixed(2),
                  itemCost.toFixed(2),
                  itemProfit.toFixed(2),
                  itemMargin.toFixed(1),
                  `"${transaction.payment_status === 'paid' ? 'Pago' : 'Pendente'}"`
                ].join(','));
              }
            });
          }
          // Para transações com item único (compatibilidade com versão anterior)
          else {
            const product = products.find(p => p.id === transaction.product_id);
            if (product) {
              const transactionCost = (transaction.quantity || 0) * product.cost;
              const transactionProfit = transaction.total - transactionCost;
              const transactionMargin = transaction.total > 0 ? (transactionProfit / transaction.total) * 100 : 0;

              csvContent.push([
                `"${format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}"`,
                `"${product.name}"`,
                transaction.quantity || 0,
                transaction.total.toFixed(2),
                transactionCost.toFixed(2),
                transactionProfit.toFixed(2),
                transactionMargin.toFixed(1),
                `"${transaction.payment_status === 'paid' ? 'Pago' : 'Pendente'}"`
              ].join(','));
            }
          }
        });
      } else {
        // Cabeçalhos para relatório de estoque
        csvContent.push(['Produto', 'Categoria', 'Estoque', 'Status', 'Valor Custo (R$)'].join(','));

        // Dados do estoque
        currentReportData.forEach(item => {
          const inventoryItem = item as { name: string, category: string, currentStock: number, status: string, stockValue: number };
          csvContent.push([
            `"${inventoryItem.name}"`,
            `"${inventoryItem.category}"`,
            inventoryItem.currentStock,
            `"${inventoryItem.status}"`,
            inventoryItem.stockValue.toFixed(2)
          ].join(','));
        });
      }

      const csvString = csvContent.join('\n');

      // Criar blob e download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório CSV exportado!');
    } catch (error) {
      handleError(error, 'reportsPageCSV');
      toast.error('Erro ao exportar CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as 'sales' | 'inventory')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sales">Vendas</option>
              <option value="inventory">Estoque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'day' | 'week' | 'month' | 'custom')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="day">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {periodFilter === 'custom' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Vendas Mensais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Vendas Mensais
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Mês</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // console.log('monthlySalesData:', monthlySalesData);
                return monthlySalesData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-2 text-gray-900 dark:text-white">{data.name}</td>
                    <td className="py-2 text-gray-900 dark:text-white">R$ {data.sales.toFixed(2)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dados do Relatório */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          {selectedReport === 'sales' ? <TrendingUp className="w-4 h-4 mr-2" /> : <Package className="w-4 h-4 mr-2" />}
          {selectedReport === 'sales' ? 'Dados de Vendas' : 'Dados do Estoque'}
        </h3>
        <div className="overflow-x-auto">
          {selectedReport === 'sales' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Produto</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Categoria</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Qtd</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Receita</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Custo</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Lucro</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const salesData = currentReportData as Array<{ name: string, category: string, quantity: number, revenue: number, cost: number, profit: number }>;
                  // console.log('salesData:', salesData);
                  return salesData.map((item, index) => {
                    const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                        <td className="py-2 font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{item.name}</td>
                        <td className="py-2 text-gray-900 dark:text-white">{item.category}</td>
                        <td className="py-2 text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="py-2 text-green-600 font-medium">R$ {item.revenue.toFixed(2)}</td>
                        <td className="py-2 text-red-600 font-medium">R$ {item.cost.toFixed(2)}</td>
                        <td className="py-2 text-blue-600 font-medium">R$ {item.profit.toFixed(2)}</td>
                        <td className="py-2 font-medium">{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Produto</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Estoque</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const inventoryData = currentReportData as Array<{ name: string, currentStock: number, status: string, stockValue: number }>;
                  // console.log('inventoryData:', inventoryData);
                  return inventoryData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                      <td className="py-2 font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{item.name}</td>
                      <td className="py-2 text-gray-900 dark:text-white">{item.currentStock}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Baixo'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900 dark:text-white">R$ {item.stockValue.toFixed(2)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detalhamento de Transações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Receipt className="w-4 h-4 mr-2" />
          Detalhamento de Transações
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Data</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Produto</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Tipo</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Qtd</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Valor Unit.</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Total</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Custo</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Lucro</th>
                <th className="pb-2 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Filtrar todas as transações pelo período selecionado
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0); // Início do dia
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                // Debug
                console.log('Filtrando detalhamento:', { startDate, endDate, dateRange });
                console.log('Transações totais:', transactions.length);

                // Verificar se há transações antes de filtrar
                if (transactions.length === 0) {
                  // console.log('Nenhuma transação encontrada');
                  return [];
                }

                const allTransactions = transactions.filter(t => {
                  // Verificar se a transação tem data
                  if (!t.created_at) {
                    // console.log('Transação sem data:', t);
                    return false;
                  }

                  const transactionDate = new Date(t.created_at);
                  const isInRange = transactionDate >= startDate && transactionDate <= endDate;

                  return isInRange;
                });

                console.log('Transações filtradas:', allTransactions.length);

                // Debug das primeiras transações
                if (transactions.length > 0) {
                  console.log('Primeira transação:', transactions[0].created_at, new Date(transactions[0].created_at));
                }

                // Processar transações com múltiplos itens
                const detailedTransactions: Array<any> = [];
                allTransactions.forEach(transaction => {
                  // Para transações com múltiplos itens
                  if (transaction.items && transaction.items.length > 0) {
                    transaction.items.forEach(item => {
                      const product = products.find(p => p.id === item.product_id);
                      if (product) {
                        const itemCost = item.quantity * product.cost;
                        const itemProfit = item.total - itemCost;

                        detailedTransactions.push({
                          ...transaction,
                          product_name: product.name,
                          quantity: item.quantity,
                          unit_price: item.unit_price,
                          total: item.total,
                          cost: itemCost,
                          profit: itemProfit
                        });
                      }
                    });
                  }
                  // Para transações com item único (compatibilidade com versão anterior)
                  else {
                    const product = products.find(p => p.id === transaction.product_id);
                    if (product) {
                      const transactionCost = (transaction.quantity || 0) * product.cost;
                      const transactionProfit = transaction.total - transactionCost;

                      detailedTransactions.push({
                        ...transaction,
                        product_name: product.name,
                        quantity: transaction.quantity || 0,
                        unit_price: transaction.unit_price || 0,
                        total: transaction.total,
                        cost: transactionCost,
                        profit: transactionProfit
                      });
                    }
                  }
                });

                // console.log('detailedTransactions:', detailedTransactions);
                return detailedTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-2 text-gray-900 dark:text-white text-xs">
                      {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="py-2 font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                      {transaction.product_name}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${transaction.type === 'sale'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : transaction.type === 'purchase'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {transaction.type === 'sale' ? 'Venda' : transaction.type === 'purchase' ? 'Compra' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-900 dark:text-white">{transaction.quantity}</td>
                    <td className="py-2 text-gray-900 dark:text-white">R$ {(transaction.unit_price || 0).toFixed(2)}</td>
                    <td className={`py-2 font-medium ${transaction.type === 'sale' ? 'text-green-600' : transaction.type === 'purchase' ? 'text-red-600' : 'text-gray-600'}`}>
                      R$ {(transaction.total || 0).toFixed(2)}
                    </td>
                    <td className="py-2 text-red-600 font-medium">R$ {(transaction.cost || 0).toFixed(2)}</td>
                    <td className={`py-2 font-medium ${(transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {(transaction.profit || 0).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${transaction.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {transaction.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
