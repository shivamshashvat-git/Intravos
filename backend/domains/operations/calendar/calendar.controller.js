
import calendarService from './calendar.service.js';
import { calendarEventSchema, updateCalendarEventSchema, calendarFilterSchema } from './calendar.schema.js';
import response from '../../../core/utils/responseHandler.js';

class CalendarController {
  async getEvents(req, res, next) {
    try {
      const filters = calendarFilterSchema.parse(req.query);
      
      // If 'agenda' param is passed, we fetch the unified agenda (tasks, bookings, visas)
      if (req.query.agenda === 'true') {
        const data = await calendarService.getAgenda(req.user.tenantId, filters.from, filters.to);
        return response.success(res, { events: data, total: data.length, from: filters.from, to: filters.to });
      }

      // Otherwise just strict calendar events
      const data = await calendarService.getEventsInRange(req.user.tenantId, filters.from, filters.to, filters.type);
      return response.success(res, { events: data, total: data.length, from: filters.from, to: filters.to });
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async createEvent(req, res, next) {
    try {
      const validated = calendarEventSchema.parse(req.body);
      const data = await calendarService.createEvent(req.user.tenantId, req.user.id, validated);
      return response.success(res, data, 'Event created', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const validated = updateCalendarEventSchema.parse(req.body);
      const data = await calendarService.updateEvent(req.user.tenantId, req.params.id, validated);
      return response.success(res, data, 'Event updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      await calendarService.deleteEvent(req.user.tenantId, req.params.id, req.user);
      return response.success(res, null, 'Event deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarController();
