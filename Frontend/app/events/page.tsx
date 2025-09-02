'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EventsSection } from '@/components/dashboard';
import { api, Event, NetworkError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRealTimeEvents, useConnectionStatus } from '@/hooks';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const { user } = useAuth();
  const { isConnected } = useConnectionStatus();
  const { events: liveEvents, loading: liveLoading } = useRealTimeEvents();

  // Use real-time events if available, fallback to local state
  const displayEvents = liveEvents && liveEvents.length > 0 ? liveEvents : events;
  const loading = liveLoading || isLoading;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUserEvents();
      
      // Transform the API response to match the Event interface
      const transformedEvents = (data.events || []).map((event: any) => {
        const eventDateStr = event.event_time ?? event.event_date ?? event.eventTime ?? new Date().toISOString();
        return {
          id: event.id,
          title: event.title ?? '',
          description: event.description ?? '',
          location: event.location ?? 'Location not specified',
          group: (event.group && (event.group.title ?? event.group.name)) || 'Unknown Group',
          going_count: event.going_count ?? event.goingCount ?? 0,
          not_going_count: event.not_going_count ?? event.notGoingCount ?? 0,
          user_response: event.user_response ?? event.userResponse ?? 'not_responded',
          group_id: event.group_id ?? event.groupId ?? '',
          creator_id: event.creator_id ?? event.creatorId ?? '',
          creator: event.creator ?? null,
          event_time: event.event_time ?? event.eventTime ?? event.event_date ?? new Date().toISOString(),
          created_at: event.created_at ?? event.createdAt ?? new Date().toISOString(),
          updated_at: event.updated_at ?? event.updatedAt ?? new Date().toISOString(),
          date: new Date(eventDateStr).toLocaleDateString(),
          time: new Date(eventDateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        } as Event;
      });
      
      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      if (err instanceof NetworkError) {
        error('Failed to load events.');
      } else {
        error('Unable to load events right now.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link 
              href="/dashboard" 
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <h1 className="text-4xl font-bold text-white">Events</h1>
                <div className={`text-sm px-3 py-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isConnected ? 'Live Updates' : 'Offline Mode'}
                </div>
              </div>
              <p className="text-xl text-white/70">Manage and participate in community events</p>
              {!isConnected && (
                <p className="text-yellow-400 text-sm mt-2">
                  You're offline. Events will sync when connection is restored.
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <span className="ml-3 text-white">Loading events...</span>
              </div>
            ) : (
              <EventsSection events={displayEvents} onEventsUpdate={fetchEvents} />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
