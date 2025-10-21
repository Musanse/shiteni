// Currency formatting utility
export const formatCurrency = (amount: number, currency: string = 'ZMW'): string => {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'ZMW': 'ZMW ',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$'
  };

  const symbol = currencySymbols[currency] || currency + ' ';
  
  // Format number with 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  return `${symbol}${formattedAmount}`;
};

// Get currency symbol only
export const getCurrencySymbol = (currency: string = 'ZMW'): string => {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'ZMW': 'ZMW ',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$'
  };

  return currencySymbols[currency] || currency + ' ';
};
