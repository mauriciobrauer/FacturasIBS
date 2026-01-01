'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileUpload } from '@/components/upload/FileUpload';
import { ExtractedData } from '@/components/upload/ExtractedData';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InvoicesTable } from '@/components/dashboard/InvoicesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UploadedFile, InvoiceData } from '@/lib/types';
import { FileText, DollarSign, Upload, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Sincronización completada');
        window.location.reload();
      } else {
        alert('Error al sincronizar: ' + data.error);
      }
    } catch (error) {
      alert('Error de conexión al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };
  // Cargar facturas desde Notion para persistencia tras refresh
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/invoices/notion');
        if (res.ok) {
          const j = await res.json();
          const arr: InvoiceData[] = j?.data?.invoices || [];
          // Ordenar por fecha descendente (más reciente arriba)
          arr.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          setInvoices(arr);
        }
      } catch (_) { }
    })();
  }, []);

  // Mock data - en producción vendría de la API
  const mockInvoices: InvoiceData[] = [
    {
      id: '1',
      fecha: '2023-10-26',
      monto: 120.75,
      proveedor: 'Staples Inc.',
      descripcion: 'Material de oficina',
      archivoUrl: 'https://dropbox.com/file1',
      estado: 'completado',
      fechaCreacion: '2023-10-26T10:00:00Z',
      fechaActualizacion: '2023-10-26T10:05:00Z',
    },
    {
      id: '2',
      fecha: '2023-10-26',
      monto: 89.50,
      proveedor: 'Farmacia Central',
      descripcion: 'Medicamentos recetados',
      archivoUrl: 'https://dropbox.com/file2',
      estado: 'procesando',
      fechaCreacion: '2023-10-26T11:00:00Z',
      fechaActualizacion: '2023-10-26T11:02:00Z',
    },
  ];

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file);
    const uploadedFile: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    console.log('UploadedFile created:', uploadedFile);
    setSelectedFile(uploadedFile);
    setOriginalFile(file); // Guardar el archivo original
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setOriginalFile(null);
  };

  const handleUpload = async () => {
    console.log('handleUpload called, selectedFile:', selectedFile);
    console.log('originalFile:', originalFile);
    if (!selectedFile || !originalFile) {
      console.log('No file selected, returning');
      return;
    }

    console.log('Starting upload...');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', originalFile); // Usar el archivo original

      // Progreso simulado inicial hasta 90%
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            console.log('⏳ Progreso alcanzó 90%, deteniendo intervalo rápido y comenzando avance lento...');
            clearInterval(progressInterval);
            try {
              startWaitingProgress();
            } catch (e) {
              console.warn('No se pudo iniciar avance lento:', e);
            }
            return 90;
          }
          const next = prev + 10;
          console.log('⏳ Progreso rápido:', next);
          return next;
        });
      }, 200);
      progressIntervalRef.current = progressInterval as unknown as NodeJS.Timeout;

      // A partir de 90%, avanzar lentamente hasta 99% mientras esperamos respuesta
      let waitingInterval: NodeJS.Timeout | null = null;
      const startWaitingProgress = () => {
        if (waitingInterval) return;
        console.log('⏳ Iniciando avance lento hacia 99%...');
        waitingInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = prev < 99 ? prev + 1 : prev;
            if (next !== prev) {
              console.log('⏳ Progreso lento:', next);
            }
            return next;
          });
        }, 1000);
        waitingIntervalRef.current = waitingInterval;
      };

      // Timeout de seguridad para cortar si el server tarda demasiado
      const controller = new AbortController();
      setUploadController(controller);
      const timeoutMs = 60000; // 60s
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⏰ Timeout alcanzado, abortando petición...');
      }, timeoutMs);
      timeoutIdRef.current = timeoutId as unknown as NodeJS.Timeout;

      console.log('Sending request to /api/upload...');
      console.time('⏱️ /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const result = await response.json();
      console.log('Response result:', result);
      console.timeEnd('⏱️ /api/upload');

      if (response.ok) {
        // Completar a 100%
        if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setUploadController(null);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setSelectedFile(null);
          setOriginalFile(null);
          setUploadProgress(0);
          // Mostrar los datos extraídos
          setExtractedData(result.data);
          // Asegurar que seguimos en la sección de subida para ver el resultado
          setActiveSection('upload');
          console.log('Factura subida exitosamente:', result.data);
        }, 1000);
      } else {
        if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setUploadController(null);
        console.warn('❗ Respuesta NO OK. isDuplicate:', result?.isDuplicate, 'error:', result?.error);
        // Manejar caso de factura duplicada
        if (result.isDuplicate) {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
          setOriginalFile(null);

          // Mostrar mensaje de duplicado con información de la factura existente
          const duplicateMessage = `${result.message}\n\nFactura existente:\n` +
            `- Fecha: ${new Date(result.existingInvoice.fecha).toLocaleDateString('es-MX')}\n` +
            `- Monto: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.existingInvoice.monto)}\n` +
            `- Proveedor: ${result.existingInvoice.proveedor}\n` +
            `- Estado: ${result.existingInvoice.estado}`;

          alert(duplicateMessage);
          return;
        }

        throw new Error(result.error || 'Error subiendo archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Asegurar limpieza de timers y mostrar feedback si se abortó por timeout
      if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadController(null);
      setUploadProgress((prev) => (prev < 99 ? 99 : prev));
      setIsUploading(false);
      setUploadProgress(0);
      setOriginalFile(null);

      // Mostrar mensaje de error específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const friendly = errorMessage.includes('The user aborted a request') || errorMessage.includes('aborted')
        ? 'Tiempo de espera agotado. Intenta de nuevo.'
        : errorMessage;
      alert(`Error subiendo archivo: ${friendly}`);
    }
  };

  const handleCancelUpload = () => {
    console.log('🛑 Cancelar subida presionado');
    try {
      uploadController?.abort();
    } catch { }
    if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setUploadController(null);
    setIsUploading(false);
    setUploadProgress(0);
    // No eliminamos el archivo seleccionado para permitir reintentar rápidamente
  };

  const handleViewDetails = (invoice: InvoiceData) => {
    console.log('View details for invoice:', invoice);
    // Implementar modal o página de detalles
  };

  const handleConfirmExtractedData = async () => {
    if (extractedData) {
      // Agregar la factura a la lista local
      const newInvoice: InvoiceData = {
        ...extractedData,
        id: Date.now().toString(), // ID temporal
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: 'completado'
      };

      setInvoices(prevInvoices => {
        const updated = [newInvoice, ...prevInvoices];
        return updated.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      });
      console.log('Factura confirmada y agregada:', newInvoice);

      // Guardar en el servicio de almacenamiento persistente
      try {
        const response = await fetch('/api/invoices/storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoice: newInvoice }),
        });

        if (response.ok) {
          console.log('Factura guardada en almacenamiento persistente');
        } else {
          console.error('Error guardando factura en almacenamiento');
        }
      } catch (error) {
        console.error('Error guardando factura:', error);
      }
    }

    setExtractedData(null);
    // Redirigir al Panel de Control
    setActiveSection('dashboard');
  };

  const handleCancelExtractedData = async () => {
    if (extractedData?.archivoUrl) {
      try {
        // Extraer el path del archivo de la URL de Dropbox
        const url = new URL(extractedData.archivoUrl);
        const path = url.pathname;

        // Llamar a la API para eliminar el archivo de Dropbox
        const response = await fetch('/api/delete-dropbox-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: path }),
        });

        if (response.ok) {
          console.log('Archivo eliminado de Dropbox');
        } else {
          console.error('Error eliminando archivo de Dropbox');
        }
      } catch (error) {
        console.error('Error eliminando archivo:', error);
      }
    }

    setExtractedData(null);
  };

  // (Eliminado soporte de múltiples archivos)

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        console.log('🔍 Debug Dashboard - Rendering dashboard');
        return (
          <div className="space-y-2 sm:space-y-3 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel de Control</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </Button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <StatsCard
                title="Total Facturas"
                value={invoices.length.toString()}
                borderColor="border-l-primary-500"
                icon={<FileText className="w-6 h-6" />}
              />
              <StatsCard
                title="Monto Total"
                value={new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(invoices.reduce((sum, inv) => sum + inv.monto, 0))}
                borderColor="border-l-blue-500"
                icon={<DollarSign className="w-6 h-6" />}
              />
            </div>

            {/* Facturas o Estado Vacío */}
            {invoices.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No hay facturas</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
                  Comienza subiendo tu primera factura médica.
                </p>
                <div className="mt-4 sm:mt-6">
                  <Button
                    onClick={() => setActiveSection('upload')}
                    className="bg-primary-500 hover:bg-primary-600 text-white text-sm sm:text-base px-4 py-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Factura
                  </Button>

                </div>
              </div>
            ) : (
              <InvoicesTable
                invoices={invoices}
                onViewDetails={handleViewDetails}
              />
            )}


          </div>
        );

      case 'invoices':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Todas las Facturas</h1>
            <InvoicesTable
              invoices={mockInvoices}
              onViewDetails={handleViewDetails}
            />
          </div>
        );


      default:
        return null;
    }
  };

  console.log('🔍 Debug Layout - activeSection:', activeSection);
  console.log('🔍 Debug Layout - invoices.length:', invoices.length);

  console.log('🔍 Debug Layout - window.innerWidth:', typeof window !== 'undefined' ? window.innerWidth : 'SSR');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-4rem)]">
        <Sidebar
          onUploadClick={() => setActiveSection('upload')}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {activeSection === 'upload' ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {/* Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subir Facturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      onUpload={handleUpload}
                      selectedFile={selectedFile}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                      onCancelUpload={handleCancelUpload}
                    />
                  </CardContent>
                </Card>

                {extractedData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resultado de Extracción</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Fecha</p>
                          <p className="font-medium text-gray-900">{new Date(extractedData.fecha).toLocaleDateString('es-MX')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-medium text-gray-900">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(extractedData.monto)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Folio Fiscal</p>
                          <p className="font-mono text-xs text-gray-900 break-all">{extractedData.folioFiscal || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Archivo</p>
                          <a className="text-primary-600 underline" target="_blank" rel="noreferrer" href={extractedData.archivoUrl}>Ver en Dropbox</a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Modal de datos extraídos */}
      {extractedData && (
        <ExtractedData
          invoiceData={extractedData}
          onConfirm={handleConfirmExtractedData}
          onCancel={handleCancelExtractedData}
        />
      )}


    </div>
  );
}
