import { useState, useEffect, useCallback } from 'react';
import { FinancialSummary } from '@/core/contexts/LocalDatabaseContext';
import { handleError } from '@/shared/utils/errorHandler';

/**
 * Custom hook for managing financial data
 * @param getFinancialSummary - Function to fetch financial summary data
 * @param transactions - Transactions array to watch for changes
 * @returns Financial data and loading state
 */
const useFinancialData = (
  getFinancialSummary: () => Promise<FinancialSummary>,
  transactions: any[]
) => {
  const [financialData, setFinancialData] = useState<FinancialSummary>({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesCount: 0,
    purchasesCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFinancialSummary();
      setFinancialData(data);
    } catch (error) {
      handleError(error, 'financialData');
    } finally {
      setLoading(false);
    }
  }, [getFinancialSummary]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData, transactions]);

  return { financialData, loading, refresh: loadFinancialData };
};

export default useFinancialData;
