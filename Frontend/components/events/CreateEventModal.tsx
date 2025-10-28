'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api, CreateEventRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { CreateEventModalProps } from '@/types/events';

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
      success('Event created!');
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

export default CreateEventModal;