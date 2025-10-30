import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function SpendingChart() {
  // Placeholder chart component
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencias de Gasto Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="w-full h-8 bg-primary-500 rounded-sm opacity-60"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          Gráfico de gastos mensuales (placeholder)
        </p>
      </CardContent>
    </Card>
  );
}
