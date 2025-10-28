import { Event, EventResponse, CreateEventRequest, UpdateEventRequest, GroupResponse } from '@/lib/api';

export interface EventsSectionProps {
  events: Event[];
  onEventsUpdate: () => void;
  isLoading?: boolean;
}

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  groups: GroupResponse[];
  groupRoles: { [groupId: number]: { role: string; is_admin_or_creator: boolean } };
}

export interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventResponse | null;
  onEventUpdated: () => void;
}

export interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventResponse | null;
  onEventDeleted: () => void;
  onEventUpdated: () => void;
  groupRoles?: { [groupId: number]: { role: string; is_admin_or_creator: boolean } };
}

export interface EventResponseData {
  responses: {
    going: EventResponseItem[];
    not_going: EventResponseItem[];
  };
  counts: {
    going: number;
    not_going: number;
  };
}

export interface EventResponseItem {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateEventProps {
  show: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  groupId: number;
}

export interface CreateGeneralEventProps {
  show: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  createEvent?: (eventGroupId: number, eventData: { title: string; description: string; event_time: string }) => Promise<{ message: string }>;
}