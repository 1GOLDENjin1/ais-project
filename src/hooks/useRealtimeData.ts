import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeDataOptions {
  tableName: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string; // SQL filter condition
  enabled?: boolean;
}

export function useRealtimeData({
  tableName,
  onInsert,
  onUpdate,
  onDelete,
  filter,
  enabled = true
}: UseRealtimeDataOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create a unique channel name
    const channelName = `realtime-${tableName}-${Date.now()}`;
    
    // Create realtime channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          ...(filter && { filter })
        },
        (payload) => {
          console.log(`Realtime ${payload.eventType} on ${tableName}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tableName, onInsert, onUpdate, onDelete, filter, enabled]);

  // Function to manually unsubscribe
  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  return { unsubscribe };
}

// Specialized hooks for specific tables
export function useAppointmentRealtime(
  onAppointmentChange?: (payload: any) => void,
  enabled = true
) {
  return useRealtimeData({
    tableName: 'appointments',
    onInsert: onAppointmentChange,
    onUpdate: onAppointmentChange,
    onDelete: onAppointmentChange,
    enabled
  });
}

export function useDoctorScheduleRealtime(
  onScheduleChange?: (payload: any) => void,
  enabled = true
) {
  return useRealtimeData({
    tableName: 'doctor_schedules',
    onInsert: onScheduleChange,
    onUpdate: onScheduleChange,
    onDelete: onScheduleChange,
    enabled
  });
}

export function useTaskRealtime(
  onTaskChange?: (payload: any) => void,
  enabled = true
) {
  return useRealtimeData({
    tableName: 'tasks',
    onInsert: onTaskChange,
    onUpdate: onTaskChange,
    onDelete: onTaskChange,
    enabled
  });
}

export function useServicesRealtime(
  onServiceChange?: (payload: any) => void,
  enabled = true
) {
  return useRealtimeData({
    tableName: 'services',
    onInsert: onServiceChange,
    onUpdate: onServiceChange,
    onDelete: onServiceChange,
    enabled
  });
}