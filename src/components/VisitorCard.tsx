import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface VisitorCardProps {
  visitor: {
    id: string;
    name: string;
    email: string;
    status: string;
    visitDate: string;
  };
  onStatusChange: (id: string, status: string) => void;
}

export const VisitorCard = memo<VisitorCardProps>(({ visitor, onStatusChange }) => {
  const statusColor = useMemo(() => {
    switch (visitor.status) {
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'checked-out': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }, [visitor.status]);

  const formattedDate = useMemo(() => {
    return new Date(visitor.visitDate).toLocaleDateString();
  }, [visitor.visitDate]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{visitor.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{visitor.email}</p>
          <div className="flex justify-between items-center">
            <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
              {visitor.status}
            </span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VisitorCard.displayName = 'VisitorCard';