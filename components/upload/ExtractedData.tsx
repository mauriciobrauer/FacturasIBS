'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InvoiceData } from '@/lib/types';
import { Calendar, DollarSign, Hash, Link, CheckCircle } from 'lucide-react';

interface ExtractedDataProps {
  invoiceData: InvoiceData;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExtractedData({ invoiceData, onConfirm, onCancel }: ExtractedDataProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            <span>Datos Extraídos de la Factura</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Información extraída */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Fecha */}
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-blue-900 text-sm sm:text-base">Fecha de Emisión</h3>
                <p className="text-blue-700 text-sm sm:text-base truncate">{formatDate(invoiceData.fecha)}</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-green-900 text-sm sm:text-base">Total</h3>
                <p className="text-green-700 font-semibold text-base sm:text-lg truncate">
                  {formatCurrency(invoiceData.monto)}
                </p>
              </div>
            </div>

            {/* Folio Fiscal */}
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-purple-50 rounded-lg">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-purple-900 text-sm sm:text-base">Folio Fiscal</h3>
                {invoiceData.folioFiscal ? (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <p className="text-purple-700 font-mono text-xs sm:text-sm truncate">
                      {invoiceData.folioFiscal}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(invoiceData.folioFiscal!)}
                      className="text-xs px-2 py-1"
                    >
                      Copiar
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No disponible</p>
                )}
              </div>
            </div>

            {/* Link de Dropbox */}
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-orange-50 rounded-lg">
              <Link className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-orange-900 text-sm sm:text-base">Archivo en Dropbox</h3>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <a
                    href={invoiceData.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-700 hover:text-orange-800 underline text-xs sm:text-sm truncate"
                  >
                    Ver archivo
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invoiceData.archivoUrl)}
                    className="text-xs px-2 py-1"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </div>


          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto text-sm sm:text-base px-4 py-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm} 
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm sm:text-base px-4 py-2"
            >
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
