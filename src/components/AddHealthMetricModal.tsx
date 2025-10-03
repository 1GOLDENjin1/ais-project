import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { HealthMetricsService } from '../services/databaseService';

interface AddHealthMetricModalProps {
  patientId: string;
  onMetricAdded: () => void;
  children: React.ReactNode;
}

export const AddHealthMetricModal: React.FC<AddHealthMetricModalProps> = ({
  patientId,
  onMetricAdded,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    metricType: '',
    value: '',
    unit: '',
    notes: ''
  });
  const { toast } = useToast();

  const metricTypes = [
    { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
    { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
    { value: 'weight', label: 'Weight', unit: 'kg', placeholder: '70' },
    { value: 'height', label: 'Height', unit: 'cm', placeholder: '170' },
    { value: 'temperature', label: 'Temperature', unit: '°C', placeholder: '37.0' },
    { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', placeholder: '90' },
    { value: 'cholesterol', label: 'Cholesterol', unit: 'mg/dL', placeholder: '180' },
    { value: 'bmi', label: 'BMI', unit: '', placeholder: '22.5' },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation', unit: '%', placeholder: '98' },
    { value: 'steps', label: 'Daily Steps', unit: 'steps', placeholder: '8000' }
  ];

  const selectedMetric = metricTypes.find(m => m.value === formData.metricType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.metricType || !formData.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const metricValue = selectedMetric?.unit 
        ? `${formData.value} ${selectedMetric.unit}`
        : formData.value;

      const success = await HealthMetricsService.addMetric(
        patientId,
        formData.metricType,
        metricValue
      );

      if (success) {
        toast({
          title: "Success",
          description: "Health metric added successfully.",
        });
        setFormData({ metricType: '', value: '', unit: '', notes: '' });
        setOpen(false);
        onMetricAdded();
      } else {
        throw new Error('Failed to add metric');
      }
    } catch (error) {
      console.error('Error adding health metric:', error);
      toast({
        title: "Error",
        description: "Failed to add health metric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Health Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metricType">Metric Type *</Label>
            <Select
              value={formData.metricType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, metricType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric type" />
              </SelectTrigger>
              <SelectContent>
                {metricTypes.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value *</Label>
            <div className="flex gap-2">
              <Input
                id="value"
                type="text"
                placeholder={selectedMetric?.placeholder || "Enter value"}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="flex-1"
              />
              {selectedMetric?.unit && (
                <div className="flex items-center px-3 bg-gray-100 border rounded text-sm text-gray-600">
                  {selectedMetric.unit}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Metric'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};