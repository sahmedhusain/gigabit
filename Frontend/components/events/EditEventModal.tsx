'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api, UpdateEventRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { EditEventModalProps } from '@/types/events';

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
      success('Event updated!');
      onEventUpdated();
      onClose();
    } catch {
      error('Failed to update event!')
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

export default EditEventModal;