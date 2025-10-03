import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Circle,
  Award,
  Activity,
  Heart,
  Weight,
  Zap,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface HealthGoal {
  id: string;
  patientId: string;
  goalType: 'weight_management' | 'exercise' | 'medication_adherence' | 'blood_pressure' | 'blood_sugar' | 'nutrition' | 'sleep' | 'custom';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'paused' | 'discontinued';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  targetDate: string;
  completedDate?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  doctorAssigned: boolean;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  targetDate: string;
  isCompleted: boolean;
  completedDate?: string;
  completedValue?: number;
  createdAt: string;
}

interface GoalProgress {
  id: string;
  goalId: string;
  recordedValue: number;
  recordedDate: string;
  notes?: string;
  recordedBy: 'patient' | 'doctor' | 'system';
  createdAt: string;
}

interface HealthGoalTrackingProps {
  patientId: string;
  patientName: string;
  userRole: 'patient' | 'doctor' | 'staff' | 'admin';
}

export const HealthGoalTracking: React.FC<HealthGoalTrackingProps> = ({
  patientId,
  patientName,
  userRole
}) => {
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<HealthGoal | null>(null);
  const [progressRecords, setProgressRecords] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  
  const [newGoal, setNewGoal] = useState({
    goalType: 'weight_management' as HealthGoal['goalType'],
    title: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    unit: 'lbs',
    priority: 'medium' as HealthGoal['priority'],
    targetDate: '',
    isRecurring: false,
    recurringFrequency: 'weekly' as HealthGoal['recurringFrequency']
  });

  const [newProgress, setNewProgress] = useState({
    recordedValue: 0,
    notes: '',
    recordedDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadGoals();
  }, [patientId]);

  useEffect(() => {
    if (selectedGoal) {
      loadProgressRecords(selectedGoal.id);
    }
  }, [selectedGoal]);

  const loadGoals = async () => {
    try {
      // Mock goals data
      const mockGoals: HealthGoal[] = [
        {
          id: 'goal_1',
          patientId,
          goalType: 'weight_management',
          title: 'Lose 20 pounds for better health',
          description: 'Gradual weight loss through diet and exercise to improve overall health and reduce risk factors',
          targetValue: 180,
          currentValue: 200,
          unit: 'lbs',
          status: 'active',
          priority: 'high',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          isRecurring: false,
          doctorAssigned: true,
          assignedDoctorId: 'doc_1',
          assignedDoctorName: 'Dr. Maria Santos',
          milestones: [
            {
              id: 'milestone_1',
              goalId: 'goal_1',
              title: 'First 5 pounds',
              description: 'Initial weight loss milestone',
              targetValue: 195,
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              isCompleted: false,
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'goal_2',
          patientId,
          goalType: 'exercise',
          title: '30 minutes daily exercise',
          description: 'Maintain consistent daily exercise routine for cardiovascular health',
          targetValue: 30,
          currentValue: 15,
          unit: 'minutes',
          status: 'active',
          priority: 'medium',
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000).toISOString(),
          isRecurring: true,
          recurringFrequency: 'daily',
          doctorAssigned: true,
          assignedDoctorId: 'doc_1',
          assignedDoctorName: 'Dr. Maria Santos',
          milestones: [],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'goal_3',
          patientId,
          goalType: 'blood_pressure',
          title: 'Lower blood pressure to healthy range',
          description: 'Achieve target blood pressure of 120/80 through medication and lifestyle changes',
          targetValue: 120,
          currentValue: 140,
          unit: 'mmHg',
          status: 'active',
          priority: 'high',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          isRecurring: false,
          doctorAssigned: true,
          assignedDoctorId: 'doc_1',
          assignedDoctorName: 'Dr. Maria Santos',
          milestones: [],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setGoals(mockGoals);
      if (mockGoals.length > 0) {
        setSelectedGoal(mockGoals[0]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({
        title: "Error",
        description: "Failed to load health goals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgressRecords = async (goalId: string) => {
    try {
      // Mock progress data
      const mockProgress: GoalProgress[] = [
        {
          id: 'progress_1',
          goalId,
          recordedValue: goalId === 'goal_1' ? 198 : goalId === 'goal_2' ? 25 : 138,
          recordedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: goalId === 'goal_1' ? 'Feeling good about the progress' : 'Had a good workout session',
          recordedBy: 'patient',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'progress_2',
          goalId,
          recordedValue: goalId === 'goal_1' ? 196 : goalId === 'goal_2' ? 30 : 135,
          recordedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          notes: goalId === 'goal_1' ? 'Diet changes are helping' : 'Reached daily target!',
          recordedBy: 'patient',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setProgressRecords(mockProgress);
    } catch (error) {
      console.error('Error loading progress records:', error);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.targetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const goalData: HealthGoal = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        ...newGoal,
        status: 'active',
        startDate: new Date().toISOString(),
        doctorAssigned: userRole === 'doctor',
        assignedDoctorId: userRole === 'doctor' ? 'current_doctor_id' : undefined,
        assignedDoctorName: userRole === 'doctor' ? 'Current Doctor' : undefined,
        milestones: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setGoals(prev => [goalData, ...prev]);
      setSelectedGoal(goalData);
      setShowNewGoalForm(false);
      setNewGoal({
        goalType: 'weight_management',
        title: '',
        description: '',
        targetValue: 0,
        currentValue: 0,
        unit: 'lbs',
        priority: 'medium',
        targetDate: '',
        isRecurring: false,
        recurringFrequency: 'weekly'
      });

      toast({
        title: "Goal Created",
        description: "Your health goal has been created successfully",
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create health goal",
        variant: "destructive"
      });
    }
  };

  const recordProgress = async () => {
    if (!selectedGoal || !newProgress.recordedValue) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid value",
        variant: "destructive"
      });
      return;
    }

    try {
      const progressData: GoalProgress = {
        id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        goalId: selectedGoal.id,
        ...newProgress,
        recordedBy: userRole === 'patient' ? 'patient' : 'doctor',
        createdAt: new Date().toISOString()
      };

      setProgressRecords(prev => [progressData, ...prev]);

      // Update goal's current value
      setGoals(prev => prev.map(goal => 
        goal.id === selectedGoal.id 
          ? { ...goal, currentValue: newProgress.recordedValue, updatedAt: new Date().toISOString() }
          : goal
      ));

      setSelectedGoal(prev => prev ? { ...prev, currentValue: newProgress.recordedValue } : null);
      setShowProgressForm(false);
      setNewProgress({
        recordedValue: 0,
        notes: '',
        recordedDate: new Date().toISOString().split('T')[0]
      });

      toast({
        title: "Progress Recorded",
        description: "Your progress has been recorded successfully",
      });
    } catch (error) {
      console.error('Error recording progress:', error);
      toast({
        title: "Error",
        description: "Failed to record progress",
        variant: "destructive"
      });
    }
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'weight_management': return Weight;
      case 'exercise': return Activity;
      case 'blood_pressure': return Heart;
      case 'blood_sugar': return Zap;
      case 'medication_adherence': return Clock;
      default: return Target;
    }
  };

  const getGoalProgress = (goal: HealthGoal) => {
    if (goal.goalType === 'weight_management') {
      // For weight loss, progress is towards the target (lower is better)
      const totalToLose = goal.currentValue - goal.targetValue;
      const lostSoFar = Math.max(0, goal.currentValue - goal.targetValue);
      return Math.min(100, Math.max(0, ((goal.currentValue - goal.targetValue) / (goal.currentValue - goal.targetValue)) * 100));
    } else {
      // For other goals, progress is towards the target (higher is better)
      return Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading health goals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Health Goal Tracking</h1>
          <p className="text-gray-600">
            {userRole === 'patient' ? 'Track your progress towards better health' : `Managing goals for ${patientName}`}
          </p>
        </div>
        <Button onClick={() => setShowNewGoalForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList>
          <TabsTrigger value="goals">Active Goals</TabsTrigger>
          <TabsTrigger value="progress">Progress History</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.filter(g => g.status === 'active').map((goal) => {
              const IconComponent = getGoalIcon(goal.goalType);
              const progress = getGoalProgress(goal);
              
              return (
                <Card 
                  key={goal.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedGoal?.id === goal.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{goal.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {goal.currentValue} {goal.unit}</span>
                        <span>Target: {goal.targetValue} {goal.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Due: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                      </span>
                      {goal.doctorAssigned && (
                        <Badge variant="outline" className="text-xs">
                          Doctor Assigned
                        </Badge>
                      )}
                    </div>

                    {goal.isRecurring && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Clock className="h-3 w-3" />
                        <span>Recurring {goal.recurringFrequency}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {goals.filter(g => g.status === 'active').length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Goals</h3>
                <p className="text-gray-500 text-center mb-4">
                  Start your health journey by creating your first goal
                </p>
                <Button onClick={() => setShowNewGoalForm(true)}>Create Your First Goal</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {selectedGoal ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Progress for: {selectedGoal.title}</CardTitle>
                  <Button onClick={() => setShowProgressForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Progress
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressRecords.map((record) => (
                    <div key={record.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{record.recordedValue} {selectedGoal.unit}</span>
                          <Badge variant="outline" className="text-xs">
                            {record.recordedBy}
                          </Badge>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 mb-2">{record.notes}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {format(new Date(record.recordedDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ))}

                  {progressRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No progress records yet. Start tracking your journey!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Activity className="h-16 w-16 text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Goal</h3>
                  <p className="text-gray-500">Choose a goal to view its progress history</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.filter(g => g.status === 'completed').map((goal) => (
              <Card key={goal.id} className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-800">{goal.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 mb-2">{goal.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Completed</span>
                    <span className="text-green-600">
                      {goal.completedDate && format(new Date(goal.completedDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {goals.filter(g => g.status === 'completed').length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Award className="h-16 w-16 text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Achievements Yet</h3>
                  <p className="text-gray-500">Complete your first goal to earn an achievement!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Goal Modal */}
      {showNewGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Health Goal</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Goal Type</label>
                  <Select value={newGoal.goalType} onValueChange={(value: HealthGoal['goalType']) => 
                    setNewGoal(prev => ({ ...prev, goalType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_management">Weight Management</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                      <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                      <SelectItem value="medication_adherence">Medication Adherence</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Goal Title *</label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Lose 20 pounds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your goal and motivation"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Value</label>
                    <Input
                      type="number"
                      value={newGoal.currentValue || ''}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, currentValue: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Value</label>
                    <Input
                      type="number"
                      value={newGoal.targetValue || ''}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Unit</label>
                    <Input
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="lbs, minutes, mg/dl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <Select value={newGoal.priority} onValueChange={(value: HealthGoal['priority']) => 
                      setNewGoal(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Date *</label>
                    <Input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newGoal.isRecurring}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    />
                    <span className="text-sm">Recurring Goal</span>
                  </label>

                  {newGoal.isRecurring && (
                    <Select value={newGoal.recurringFrequency} onValueChange={(value: HealthGoal['recurringFrequency']) => 
                      setNewGoal(prev => ({ ...prev, recurringFrequency: value }))
                    }>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowNewGoalForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createGoal}>
                  Create Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Form Modal */}
      {showProgressForm && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Record Progress</h2>
              <p className="text-gray-600 mb-4">Goal: {selectedGoal.title}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Value ({selectedGoal.unit})</label>
                  <Input
                    type="number"
                    value={newProgress.recordedValue || ''}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, recordedValue: Number(e.target.value) }))}
                    placeholder={`Current: ${selectedGoal.currentValue} ${selectedGoal.unit}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={newProgress.recordedDate}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, recordedDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                  <Textarea
                    value={newProgress.notes}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="How are you feeling about this progress?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowProgressForm(false)}>
                  Cancel
                </Button>
                <Button onClick={recordProgress}>
                  Record Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};