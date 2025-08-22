import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, MapPin, Shield, AlertTriangle } from 'lucide-react';

// Optimized interfaces
interface VisitorData {
  id: string;
  fullName: string;
  phoneNumber: string;
  purposeOfVisit: string;
  hostResident: string;
  checkInTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked-in' | 'checked-out';
  communityId: string;
  createdAt: string;
  updatedAt: string;
}

interface OptimizedVisitorCardProps {
  visitor: VisitorData;
  onStatusChange?: (visitorId: string, newStatus: string) => void;
  onViewDetails?: (visitorId: string) => void;
  isLoading?: boolean;
  className?: string;
}

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'pending':
        return { color: 'yellow', icon: Clock, text: 'Pending' };
      case 'approved':
        return { color: 'green', icon: Shield, text: 'Approved' };
      case 'rejected':
        return { color: 'red', icon: AlertTriangle, text: 'Rejected' };
      case 'checked-in':
        return { color: 'blue', icon: MapPin, text: 'Checked In' };
      case 'checked-out':
        return { color: 'gray', icon: Clock, text: 'Checked Out' };
      default:
        return { color: 'gray', icon: Clock, text: 'Unknown' };
    }
  }, [status]);

  const Icon = statusConfig.icon;

  return (
    <Badge 
      variant={statusConfig.color === 'green' ? 'default' : 'secondary'}
      className={`flex items-center gap-1 ${
        statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        statusConfig.color === 'green' ? 'bg-green-100 text-green-800' :
        statusConfig.color === 'red' ? 'bg-red-100 text-red-800' :
        statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}
    >
      <Icon className="h-3 w-3" />
      {statusConfig.text}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized visitor actions component
const VisitorActions = memo(({ 
  visitorId, 
  status, 
  onStatusChange, 
  onViewDetails,
  isLoading 
}: {
  visitorId: string;
  status: string;
  onStatusChange?: (visitorId: string, newStatus: string) => void;
  onViewDetails?: (visitorId: string) => void;
  isLoading?: boolean;
}) => {
  const handleApprove = useCallback(() => {
    onStatusChange?.(visitorId, 'approved');
  }, [visitorId, onStatusChange]);

  const handleReject = useCallback(() => {
    onStatusChange?.(visitorId, 'rejected');
  }, [visitorId, onStatusChange]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(visitorId);
  }, [visitorId, onViewDetails]);

  if (status === 'pending') {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          onClick={handleApprove}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleReject}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reject'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleViewDetails}
          disabled={isLoading}
        >
          Details
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleViewDetails}
      disabled={isLoading}
    >
      View Details
    </Button>
  );
});

VisitorActions.displayName = 'VisitorActions';

// Main optimized visitor card component
export const OptimizedVisitorCard = memo<OptimizedVisitorCardProps>(({ 
  visitor, 
  onStatusChange, 
  onViewDetails, 
  isLoading = false,
  className = ""
}) => {
  // Memoized formatted date
  const formattedDate = useMemo(() => {
    try {
      return new Date(visitor.checkInTime || visitor.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }, [visitor.checkInTime, visitor.createdAt]);

  // Memoized visitor initials for avatar
  const visitorInitials = useMemo(() => {
    return visitor.fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [visitor.fullName]);

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {visitorInitials}
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{visitor.fullName}</CardTitle>
              <CardDescription className="text-sm">{visitor.phoneNumber}</CardDescription>
            </div>
          </div>
          <StatusBadge status={visitor.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Purpose:</span> {visitor.purposeOfVisit}
          </div>
          <div>
            <span className="font-medium">Host:</span> {visitor.hostResident}
          </div>
          <div>
            <span className="font-medium">Time:</span> {formattedDate}
          </div>
        </div>
        
        <div className="mt-4">
          <VisitorActions
            visitorId={visitor.id}
            status={visitor.status}
            onStatusChange={onStatusChange}
            onViewDetails={onViewDetails}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedVisitorCard.displayName = 'OptimizedVisitorCard';

// Memoized visitor list component for rendering multiple cards efficiently
export const OptimizedVisitorList = memo<{
  visitors: VisitorData[];
  onStatusChange?: (visitorId: string, newStatus: string) => void;
  onViewDetails?: (visitorId: string) => void;
  isLoading?: boolean;
  className?: string;
}>(({ visitors, onStatusChange, onViewDetails, isLoading, className = "" }) => {
  // Memoized rendered visitor cards
  const renderedVisitors = useMemo(() => {
    return visitors.map((visitor) => (
      <OptimizedVisitorCard
        key={visitor.id}
        visitor={visitor}
        onStatusChange={onStatusChange}
        onViewDetails={onViewDetails}
        isLoading={isLoading}
      />
    ));
  }, [visitors, onStatusChange, onViewDetails, isLoading]);

  return (
    <div className={`grid gap-4 ${className}`}>
      {renderedVisitors}
    </div>
  );
});

OptimizedVisitorList.displayName = 'OptimizedVisitorList';
