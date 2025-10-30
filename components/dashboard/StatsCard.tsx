import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  borderColor: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, borderColor, icon }: StatsCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor} p-4 sm:p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">{value}</p>
        </div>
        {icon && (
          <div className="text-gray-400 flex-shrink-0 mt-1">
            <div className="w-5 h-5 sm:w-6 sm:h-6">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
