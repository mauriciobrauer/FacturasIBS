import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { InvoiceData } from '@/lib/types';

interface InvoicesTableProps {
  invoices: InvoiceData[];
  onViewDetails: (invoice: InvoiceData) => void;
}

type SortKey = 'fecha' | 'monto';
type SortDirection = 'asc' | 'desc';

export function InvoicesTable({ invoices, onViewDetails }: InvoicesTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'fecha',
    direction: 'desc'
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (sortConfig.key === 'fecha') {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      // monto
      return sortConfig.direction === 'asc' ? a.monto - b.monto : b.monto - a.monto;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
      : <ArrowDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Todas las Facturas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="px-4 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm w-24 cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                    onClick={() => handleSort('fecha')}
                  >
                    <div className="flex items-center">
                      Fecha
                      {renderSortIcon('fecha')}
                    </div>
                  </th>
                  <th
                    className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm w-32 cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                    onClick={() => handleSort('monto')}
                  >
                    <div className="flex items-center">
                      Total
                      {renderSortIcon('monto')}
                    </div>
                  </th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm hidden md:table-cell w-40">Folio Fiscal</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm w-32">Ver en Dropbox</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                      No hay facturas registradas
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 w-24">
                        {formatDate(invoice.fecha)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 font-medium w-32">
                        {formatCurrency(invoice.monto)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell w-40">
                        {invoice.folioFiscal ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate block">
                            {invoice.folioFiscal}
                          </span>
                        ) : (
                          <span className="text-gray-400">No disponible</span>
                        )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 w-32">
                        <a
                          href={invoice.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-800 font-medium text-xs sm:text-sm"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Ver en Dropbox</span>
                          <span className="sm:hidden">Ver</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
