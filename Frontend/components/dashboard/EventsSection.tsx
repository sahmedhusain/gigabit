'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Plus, Edit, Trash2, X, Clock, Check, Wifi, WifiOff } from 'lucide-react';
import { api, Event, EventResponse, CreateEventRequest, UpdateEventRequest, GroupResponse } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRealTimeEvents, useConnectionStatus } from '@/hooks';

interface EventsSectionProps {
  events: Event[];
  onEventsUpdate: () => void;
  isLoading?: boolean;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  groups: GroupResponse[];
  groupRoles: { [groupId: number]: { role: string; is_admin_or_creator: boolean } };
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventResponse | null;
  onEventUpdated: () => void;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventResponse | null;
  onEventDeleted: () => void;
  onEventUpdated: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, groups, groupRoles }) => {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    event_time: ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  // Filter groups to only show those where user is admin or creator
  const adminGroups = groups.filter(group => 
    groupRoles[group.id]?.is_admin_or_creator === true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      error('Please select a group for the event');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateEventRequest = {
        title: formData.title,
        description: formData.description,
        event_time: new Date(formData.event_time).toISOString(),
      };
      await api.createEvent(selectedGroupId, payload);
      success('Event created successfully!');
      onEventCreated();
      onClose();
      setFormData({ title: '', description: '', event_time: '' });
      setSelectedGroupId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.';
      error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Create New Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 border border-white/20 focus:border-emerald-500 focus:outline-none"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Group</label>
            {adminGroups.length === 0 ? (
              <div className="w-full p-3 bg-red-500/10 border border-red-400/20 rounded-lg text-red-300 text-sm">
                You need to be an admin or creator of a group to create events.
              </div>
            ) : (
              <select
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="w-full p-3 bg-white/10 rounded-lg text-white border border-white/20 focus:border-emerald-500 focus:outline-none"
                required
                aria-label="Select group"
              >
                <option value="">Select a group</option>
                {adminGroups.map((group) => (
                  <option key={group.id} value={group.id} className="bg-slate-800">
                    {group.title} ({groupRoles[group.id]?.role || 'admin'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 border border-white/20 focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Describe your event"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Date & Time</label>
            <input
              type="datetime-local"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              min={formatDateTimeLocal(new Date())}
              className="w-full p-3 bg-white/10 rounded-lg text-white border border-white/20 focus:border-emerald-500 focus:outline-none"
              required
              aria-label="Event date and time"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || adminGroups.length === 0}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, onEventUpdated }) => {
  const [formData, setFormData] = useState<UpdateEventRequest>({
    title: '',
    description: '',
    event_time: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        event_time: new Date(event.event_time).toISOString().slice(0, 16)
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsLoading(true);
    try {
      await api.updateEvent(event.id, {
        ...formData,
        event_time: formData.event_time ? new Date(formData.event_time).toISOString() : undefined
      });
      success('Event updated successfully!');
      onEventUpdated();
      onClose();
    } catch (err) {
      error('Failed to update event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Edit Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 border border-white/20 focus:border-emerald-500 focus:outline-none"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 border border-white/20 focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Describe your event"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Date & Time</label>
            <input
              type="datetime-local"
              value={formData.event_time || ''}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              min={formatDateTimeLocal(new Date())}
              className="w-full p-3 bg-white/10 rounded-lg text-white border border-white/20 focus:border-emerald-500 focus:outline-none"
              aria-label="Event date and time"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  onEventDeleted, 
  onEventUpdated 
}) => {
  const [responses, setResponses] = useState<any>(null);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [isRespondingToEvent, setIsRespondingToEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (event) {
      loadEventResponses();
    }
  }, [event]);

  const loadEventResponses = async () => {
    if (!event) return;
    setIsLoadingResponses(true);
    try {
      const data = await api.getEventResponses(event.id);
      setResponses(data);
    } catch (err) {
      console.error('Failed to load event responses:', err);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleEventResponse = async (option: 'going' | 'not_going') => {
    if (!event) return;
    setIsRespondingToEvent(true);
    try {
      const res = await api.respondToEvent(event.id, option);
      if (res.removed) {
        success('Response removed');
      } else {
        success(`Marked as ${option === 'going' ? 'going' : 'not going'}!`);
      }
      await loadEventResponses();
      onEventUpdated();
    } catch (err) {
      error('Failed to record response. Please try again.');
    } finally {
      setIsRespondingToEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    setIsDeletingEvent(true);
    try {
      await api.deleteEvent(event.id);
      success('Event deleted successfully!');
      onEventDeleted();
      onClose();
    } catch (err) {
      error('Failed to delete event. Please try again.');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{event.title}</h3>
          <div className="flex items-center space-x-2">
            {/* Only show delete button to event creator */}
            {user && event.creator_id === user.id && (
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
              disabled={isRespondingToEvent}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${
                event.user_response === 'going'
                  ? 'bg-emerald-500 text-white'
                  : 'border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center">
                {event.user_response === 'going' && <Check className="w-4 h-4 mr-2" />}
                Going ({event.going_count})
              </div>
            </button>
            <button
              onClick={() => handleEventResponse('not_going')}
              disabled={isRespondingToEvent}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${
                event.user_response === 'not_going'
                  ? 'bg-red-500 text-white'
                  : 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
              }`}
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
                    {responses.responses.going.map((response: any) => (
                      <div key={response.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {response.user.first_name[0]}{response.user.last_name[0]}
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
                    {responses.responses.not_going.map((response: any) => (
                      <div key={response.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {response.user.first_name[0]}{response.user.last_name[0]}
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

export const EventsSection: React.FC<EventsSectionProps> = ({ events, onEventsUpdate, isLoading = false }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [groupRoles, setGroupRoles] = useState<{ [groupId: number]: { role: string; is_admin_or_creator: boolean } }>({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const { user } = useAuth();
  
  // Real-time events integration
  const {
    events: realtimeEvents,
    loading,
    error: eventsError,
    respond: handleEventResponse,
    getUnreadCount,
    isConnected: eventsConnected,
    markEventAsRead
  } = useRealTimeEvents()
  
  // Connection status monitoring
  const { isConnected, connectionQuality } = useConnectionStatus()
  
  // Use real-time events if available, fallback to props
  const displayEvents = realtimeEvents.length > 0 ? realtimeEvents : events

  useEffect(() => {
    loadUserGroups();
  }, [user]);

  const loadUserGroups = async () => {
    if (!user) return;
    setIsLoadingGroups(true);
    try {
      const data = await api.getUserGroups(user.id);
      const userGroups = data.data || [];
      setGroups(userGroups);
      
      // Load user roles for each group
      const rolesMap: { [groupId: number]: { role: string; is_admin_or_creator: boolean } } = {};
      await Promise.all(
        userGroups.map(async (group) => {
          try {
            const roleData = await api.getUserRole(group.id);
            rolesMap[group.id] = roleData;
          } catch (err) {
            console.error(`Failed to load role for group ${group.id}:`, err);
            rolesMap[group.id] = { role: 'member', is_admin_or_creator: false };
          }
        })
      );
      setGroupRoles(rolesMap);
    } catch (err) {
      console.error('Failed to load user groups:', err);
      setGroups([]);
      setGroupRoles({});
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleEventClick = async (event: Event) => {
    try {
      const eventDetails = await api.getEvent(event.id);
      setSelectedEvent(eventDetails);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  const handleEditEvent = (event: EventResponse) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  // Check if user has admin or creator role in any group
  const canCreateEvents = Object.values(groupRoles).some(role => role.is_admin_or_creator);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">My Events</h2>
          {canCreateEvents && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          )}
        </div>
        
        {/* Connection warnings */}
        {!isConnected && (
          <div className="mb-4 flex items-center gap-2 text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded-lg p-3">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>Connection lost - events may not update in real-time</span>
          </div>
        )}
        
        {connectionQuality === 'poor' && isConnected && (
          <div className="mb-4 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
            <Wifi className="w-4 h-4 flex-shrink-0" />
            <span>Poor connection - real-time updates may be slow</span>
          </div>
        )}
        <div className="space-y-3 lg:space-y-4">
          {isLoading ? (
            <div className="text-center text-white/60 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto mb-4"></div>
              <p>Loading your events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-lg mb-2">No events yet</p>
              <p className="text-sm">Create your first event to get started!</p>
            </div>
          ) : (
            events
              .sort((a, b) => {
                // Sort by event date - upcoming events first, then past events
                const dateA = new Date(a.event_time);
                const dateB = new Date(b.event_time);
                const now = new Date();
                
                const aIsPast = dateA < now;
                const bIsPast = dateB < now;
                
                // If both are upcoming or both are past, sort by date
                if (aIsPast === bIsPast) {
                  return aIsPast ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
                }
                
                // Upcoming events come first
                return aIsPast ? 1 : -1;
              })
              .map((event) => {
                const eventDate = new Date(event.event_time);
                const isExpired = eventDate < new Date();
                const isToday = eventDate.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={event.id} 
                    className={`bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer border-l-4 ${
                      isExpired ? 'border-gray-500 opacity-75' : 
                      isToday ? 'border-yellow-500' : 
                      'border-emerald-500'
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-3 lg:mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg lg:text-xl font-semibold text-white">{event.title}</h3>
                          {isToday && (
                            <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-medium">
                              Today
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-white/70 mb-3 text-sm lg:text-base line-clamp-2">{event.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm text-white/60">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                            <span className={isToday ? 'text-yellow-400 font-medium' : ''}>
                              {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                            {event.group?.title || 'Unknown Group'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center lg:text-right">
                        {/* User status badge */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 mb-3">
                          {(() => {
                            const status = event.user_response === 'going' ? 'Going' : 
                                         event.user_response === 'not_going' ? 'Not Going' : 'Pending';
                            const statusClasses =
                              event.user_response === 'going'
                                ? 'bg-emerald-600 text-white'
                                : event.user_response === 'not_going'
                                ? 'bg-red-600 text-white'
                                : 'border border-yellow-500 text-yellow-400';
                            return (
                              <span className={`px-3 lg:px-4 py-1 rounded-full text-xs lg:text-sm ${statusClasses}`}>
                                Your status: {status}
                              </span>
                            );
                          })()}
                        </div>
                        
                        {/* Response counts */}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                          <div className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm ${
                            event.user_response === 'going' 
                              ? 'bg-emerald-500 text-white' 
                              : 'border border-emerald-500/50 text-emerald-400'
                          }`}>
                            <Check className="w-3 h-3 inline mr-1" />
                            Going: {event.going_count || 0}
                          </div>
                          <div className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm ${
                            event.user_response === 'not_going' 
                              ? 'bg-red-500 text-white' 
                              : 'border border-red-500/50 text-red-400'
                          }`}>
                            <X className="w-3 h-3 inline mr-1" />
                            Not Going: {event.not_going_count || 0}
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2 justify-center lg:justify-end">
                          {/* Only show edit button to event creator */}
                          {user && event.creator_id === user.id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const full = await api.getEvent(event.id);
                                  handleEditEvent(full);
                                } catch (err) {
                                  console.error('Failed to load event for edit:', err);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              aria-label="Edit event"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className="px-3 py-2 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={onEventsUpdate}
        groups={groups}
        groupRoles={groupRoles}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={selectedEvent}
        onEventUpdated={onEventsUpdate}
      />

      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
        onEventDeleted={onEventsUpdate}
        onEventUpdated={onEventsUpdate}
      />
    </div>
  );
};

export default EventsSection;
