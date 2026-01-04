import { useState, useMemo } from 'react';

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Custom hook for managing date filters
 * @returns Date filter state and helper functions
 */
const useDateFilter = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const getDateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(today.setDate(today.getDate() - 90));
        break;
      case '1y':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(today.setDate(today.getDate() - 30));
    }

    return { startDate, endDate: new Date() };
  }, [dateRange]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  return { dateRange, getDateRange, handleDateRangeChange };
};

export default useDateFilter;