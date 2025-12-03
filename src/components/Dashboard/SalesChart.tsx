import React, { memo } from 'react';

interface SalesChartProps {
  salesData: Array<{ date: string; sales: number; purchases: number }>;
}

const SalesChart: React.FC<SalesChartProps> = memo(({ salesData }) => {
  // Encontrar os valores máximo e mínimo para escalar o gráfico
  const allValues = [...salesData.map(d => d.sales), ...salesData.map(d => d.purchases)];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  
  // Dimensões do gráfico
  const width = 600;
  const height = 300;
  const padding = 40;
  
  // Preparar pontos para o gráfico de vendas
  const salesPoints = salesData.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / (salesData.length - 1));
    const y = height - padding - ((d.sales - minValue) / (maxValue - minValue)) * (height - 2 * padding);
    return { x, y, date: d.date, value: d.sales };
  });
  
  // Preparar pontos para o gráfico de compras
  const purchasesPoints = salesData.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / (salesData.length - 1));
    const y = height - padding - ((d.purchases - minValue) / (maxValue - minValue)) * (height - 2 * padding);
    return { x, y, date: d.date, value: d.purchases };
  });
  
  // Gerar caminho para linha de vendas
  const salesPath = salesPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  // Gerar caminho para linha de compras
  const purchasesPath = purchasesPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  // Formatar valor como moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Tendência de Vendas e Compras
        </h3>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="min-w-full">
          {/* Grade horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * (height - 2 * padding);
            const value = minValue + (1 - ratio) * (maxValue - minValue);
            return (
              <g key={i}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#E5E7EB" 
                  strokeDasharray="4" 
                  className="dark:stroke-gray-700"
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#6B7280"
                  className="dark:fill-gray-400"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}
          
          {/* Eixo X */}
          <line 
            x1={padding} 
            y1={height - padding} 
            x2={width - padding} 
            y2={height - padding} 
            stroke="#9CA3AF" 
          />
          
          {/* Rótulos do eixo X */}
          {salesData.map((d, i) => {
            const x = padding + (i * (width - 2 * padding) / (salesData.length - 1));
            return (
              <text 
                key={i}
                x={x} 
                y={height - padding + 20} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#6B7280"
                className="dark:fill-gray-400"
              >
                {d.date}
              </text>
            );
          })}
          
          {/* Linha de vendas */}
          <path 
            d={salesPath} 
            fill="none" 
            stroke="#0088FE" 
            strokeWidth="2" 
          />
          
          {/* Pontos de vendas */}
          {salesPoints.map((p, i) => (
            <circle 
              key={`sales-${i}`}
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#0088FE" 
              stroke="#fff" 
              strokeWidth="2"
            />
          ))}
          
          {/* Linha de compras */}
          <path 
            d={purchasesPath} 
            fill="none" 
            stroke="#00C49F" 
            strokeWidth="2" 
          />
          
          {/* Pontos de compras */}
          {purchasesPoints.map((p, i) => (
            <circle 
              key={`purchases-${i}`}
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#00C49F" 
              stroke="#fff" 
              strokeWidth="2"
            />
          ))}
          
          {/* Legenda */}
          <g transform={`translate(${width - 200}, 20)`}>
            <rect x="0" y="0" width="180" height="50" fill="white" className="dark:fill-gray-800 dark:stroke-gray-700" stroke="#E5E7EB" rx="4" />
            <circle cx="10" cy="15" r="5" fill="#0088FE" />
            <text x="20" y="20" fontSize="12" fill="#6B7280" className="dark:fill-gray-400">Vendas</text>
            <circle cx="10" cy="35" r="5" fill="#00C49F" />
            <text x="20" y="40" fontSize="12" fill="#6B7280" className="dark:fill-gray-400">Compras</text>
          </g>
        </svg>
      </div>
    </div>
  );
});

export default SalesChart;