'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Trash2, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { getUserInitials } from '@/utils/avatarUtils';
import { EventDetailsModalProps, EventResponseData, EventResponseItem } from '@/types/events';

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onEventDeleted,
  onEventUpdated,
  groupRoles = {}
}) => {
  const [responses, setResponses] = useState<EventResponseData | null>(null);
  const [isRespondingToEvent, setIsRespondingToEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();

  
  const formatCancellationReason = (reason: string) => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const loadEventResponses = useCallback(async () => {
    if (!event) return;
    try {
      const data = await api.getEventResponses(event.id);
      setResponses(data);
    } catch {
      
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      loadEventResponses();
    }
  }, [event, loadEventResponses]);

  const handleEventResponse = async (option: 'going' | 'not_going') => {
    if (!event) return;
    setIsRespondingToEvent(true);
    try {
      const res = await api.respondToEvent(event.id, option);
      if (res.removed) {
        success('Response removed');
      } else {
        success('Response updated!');
      }
      await loadEventResponses();
      onEventUpdated();
    } catch {
      error('Failed to record response!')
    } finally {
      setIsRespondingToEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    setIsDeletingEvent(true);
    try {
      await api.cancelEvent(event.id, { cancel_reason: 'Event cancelled by organizer' });
      success('Event cancelled!');
      onEventDeleted();
      onClose();
    } catch {
      error('Failed to cancel event!')
    } finally {
      setIsDeletingEvent(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-white">{event.title}</h3>
            {event.canceled && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                CANCELED
              </span>
            )}
            {!event.canceled && new Date(event.event_time) < new Date() && (
              <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                ENDED
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Show delete button to event creator or group admins/creators */}
            {user && event && (event.creator_id === user.id || (event.group && groupRoles[event.group.id]?.is_admin_or_creator)) && (
              <button
                onClick={handleDeleteEvent}
                disabled={isDeletingEvent}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label="Delete event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-gray-300 leading-relaxed">{event.description}</p>
            {event.canceled && event.cancel_reason && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">
                  <span className="font-medium">Cancellation reason:</span> {formatCancellationReason(event.cancel_reason)}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 text-gray-300">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
              <span>{new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              <span>From: {event.group.title}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleEventResponse('going')}
              disabled={isRespondingToEvent || event.canceled || (!event.canceled && new Date(event.event_time) < new Date())}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${
                event.user_response === 'going'
                  ? 'bg-emerald-500 text-white'
                  : 'border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white'
              } ${event.canceled || (!event.canceled && new Date(event.event_time) < new Date()) ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-center justify-center">
                {event.user_response === 'going' && <Check className="w-4 h-4 mr-2" />}
                Going ({event.going_count})
              </div>
            </button>
            <button
              onClick={() => handleEventResponse('not_going')}
              disabled={isRespondingToEvent || event.canceled || (!event.canceled && new Date(event.event_time) < new Date())}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${
                event.user_response === 'not_going'
                  ? 'bg-red-500 text-white'
                  : 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
              } ${event.canceled || (!event.canceled && new Date(event.event_time) < new Date()) ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-center justify-center">
                {event.user_response === 'not_going' && <Check className="w-4 h-4 mr-2" />}
                Not Going ({event.not_going_count})
              </div>
            </button>
          </div>

          {responses && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Responses</h4>

              {responses.responses.going.length > 0 && (
                <div>
                  <h5 className="text-emerald-400 font-medium mb-2">Going ({responses.counts.going})</h5>
                  <div className="space-y-2">
                    {responses.responses.going.map((response: EventResponseItem) => (
                      <div key={response.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getUserInitials(response.user)}
                        </div>
                        <span className="text-gray-300">{response.user.first_name} {response.user.last_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {responses.responses.not_going.length > 0 && (
                <div>
                  <h5 className="text-red-400 font-medium mb-2">Not Going ({responses.counts.not_going})</h5>
                  <div className="space-y-2">
                    {responses.responses.not_going.map((response: EventResponseItem) => (
                      <div key={response.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getUserInitials(response.user)}
                        </div>
                        <span className="text-gray-300">{response.user.first_name} {response.user.last_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;