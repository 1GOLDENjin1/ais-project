import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HealthMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  date: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  target?: string;
  progress?: number;
  notes?: string;
}

interface EnhancedHealthMetricsProps {
  metrics: HealthMetric[];
  onAddMetric?: () => void;
  onViewHistory?: (metricType: string) => void;
  variant?: 'grid' | 'list';
}

export const EnhancedHealthMetrics: React.FC<EnhancedHealthMetricsProps> = ({
  metrics,
  onAddMetric,
  onViewHistory,
  variant = 'grid'
}) => {
  const getMetricIcon = (type: string) => {
    if (!type) return Activity;
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('heart') || normalizedType.includes('pulse')) return Heart;
    if (normalizedType.includes('pressure') || normalizedType.includes('blood')) return Activity;
    if (normalizedType.includes('weight') || normalizedType.includes('bmi')) return Target;
    return Activity;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-400" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const calculateProgress = (metric: HealthMetric) => {
    // Return progress if explicitly provided, otherwise calculate based on status
    if (metric.progress !== undefined) return metric.progress;
    
    // Default progress based on status
    switch (metric.status) {
      case 'normal': return 85;
      case 'high': return 65;
      case 'low': return 45;
      case 'critical': return 25;
      default: return 75;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'high': return 'bg-orange-500';
      case 'low': return 'bg-blue-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (variant === 'list') {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Health Metrics
            </CardTitle>
            <Button onClick={onAddMetric} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.map((metric) => {
            const IconComponent = getMetricIcon(metric.name);
            return (
              <div
                key={metric.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-blue-100">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                      <span className="text-sm text-gray-500">{metric.unit}</span>

                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <Badge className={`${getStatusColor(metric.status)} flex items-center gap-1`}>
                    {getStatusIcon(metric.status)}
                    {metric.status}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(metric.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
        <Button onClick={onAddMetric} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Record New Metric
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const IconComponent = getMetricIcon(metric.type);
          const progress = calculateProgress(metric);
          
          return (
            <Card
              key={metric.id}
              className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => onViewHistory?.(metric.type)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      metric.status === 'normal' ? 'bg-green-100' :
                      metric.status === 'high' ? 'bg-orange-100' :
                      metric.status === 'low' ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        metric.status === 'normal' ? 'text-green-600' :
                        metric.status === 'high' ? 'text-orange-600' :
                        metric.status === 'low' ? 'text-blue-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{metric.type}</h3>
                      <p className="text-sm text-gray-500">Latest reading</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                
                {/* Value Display */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-lg text-gray-500">{metric.unit}</span>
                  </div>
                  
                  {metric.target_range && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Target Range</span>
                        <span>{metric.target_range.min} - {metric.target_range.max} {metric.unit}</span>
                      </div>
                      <div className="relative">
                        <Progress value={progress} className="h-2" />
                        <div className={`absolute top-0 left-0 h-2 rounded-full ${getProgressColor(metric.status)}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Status and Date */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(metric.status)} flex items-center gap-1`}>
                    {getStatusIcon(metric.status)}
                    <span className="capitalize">{metric.status}</span>
                  </Badge>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(metric.date), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-gray-400">
                      by {metric.recorded_by}
                    </p>
                  </div>
                </div>
                
                {/* Notes */}
                {metric.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes: </span>
                      {metric.notes}
                    </p>
                  </div>
                )}
                
                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      View History
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      Share with Doctor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Add New Metric Card */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
          onClick={onAddMetric}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="p-4 rounded-full bg-blue-100 mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Metric</h3>
            <p className="text-sm text-gray-500 text-center">
              Track your health progress by recording new measurements
            </p>
          </CardContent>
        </Card>
      </div>
      
      {metrics.length === 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-12 text-center">
            <Activity className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Health Metrics Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start tracking your health by recording your first metric. Monitor your progress and share data with your healthcare providers.
            </p>
            <Button onClick={onAddMetric} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Record Your First Metric
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};