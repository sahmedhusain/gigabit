'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EventsSection } from '@/components/dashboard';
import { api, Event, NetworkError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const { user } = useAuth();

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
          date: new Date(eventDateStr).toLocaleDateString(),
          time: new Date(eventDateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: event.location ?? 'Location not specified',
          group: (event.group && (event.group.title ?? event.group.name)) || 'Unknown Group',
          going: event.going_count ?? event.goingCount ?? 0,
          notGoing: event.not_going_count ?? event.notGoingCount ?? 0,
          userResponse: event.user_response ?? event.userResponse ?? 'not_responded'
        };
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
              <h1 className="text-4xl font-bold text-white mb-2">Events</h1>
              <p className="text-xl text-white/70">Manage and participate in community events</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : (
              <EventsSection events={events} onEventsUpdate={fetchEvents} />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
