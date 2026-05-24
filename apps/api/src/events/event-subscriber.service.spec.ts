import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventSubscriberService } from './event-subscriber.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const mockEventTypes = vi.hoisted(() => ({
  ORG_CREATED: 'ORG_CREATED',
  USER_REGISTERED: 'USER_REGISTERED',
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
}));

vi.mock('@openbusinessos/event-definitions', () => ({
  EventTypes: mockEventTypes,
}));

describe('EventSubscriberService', () => {
  let service: EventSubscriberService;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    service = new EventSubscriberService(eventEmitter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should subscribe to all event types from EventTypes', () => {
      const onSpy = vi.spyOn(eventEmitter, 'on');

      service.onModuleInit();

      const eventTypeValues = Object.values(mockEventTypes);
      expect(onSpy).toHaveBeenCalledTimes(eventTypeValues.length);

      eventTypeValues.forEach((type) => {
        expect(onSpy).toHaveBeenCalledWith(type, expect.any(Function));
      });
    });

    it('should log when an event is received', () => {
      const loggerSpy = vi.spyOn(service['logger'], 'log');

      service.onModuleInit();
      eventEmitter.emit('TRANSACTION_CREATED', { organizationId: 'org-1' });

      expect(loggerSpy).toHaveBeenCalledWith(
        'Event received: TRANSACTION_CREATED — org: org-1',
      );
    });

    it('should register event handlers for every type in EventTypes', () => {
      service.onModuleInit();

      const listener = vi.fn();

      Object.values(mockEventTypes).forEach((type) => {
        listener.mockClear();
        eventEmitter.on(type, listener);
        eventEmitter.emit(type, { organizationId: 'org-test' });
        expect(listener).toHaveBeenCalledWith({ organizationId: 'org-test' });
      });
    });
  });

  describe('subscribe', () => {
    it('should add an event listener for the given type', () => {
      const handler = vi.fn();

      service.subscribe('CUSTOM_EVENT', handler);
      eventEmitter.emit('CUSTOM_EVENT', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should register the handler directly on eventEmitter', () => {
      const onSpy = vi.spyOn(eventEmitter, 'on');
      const handler = vi.fn();

      service.subscribe('TEST_EVENT', handler);

      expect(onSpy).toHaveBeenCalledWith('TEST_EVENT', handler);
    });

    it('should handle async handlers', async () => {
      const asyncHandler = vi.fn().mockResolvedValue(undefined);

      service.subscribe('ASYNC_EVENT', asyncHandler);
      eventEmitter.emit('ASYNC_EVENT', { value: 42 });

      await vi.waitFor(() => {
        expect(asyncHandler).toHaveBeenCalledWith({ value: 42 });
      });
    });

    it('should allow multiple handlers for the same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      service.subscribe('MULTI_EVENT', handler1);
      service.subscribe('MULTI_EVENT', handler2);

      eventEmitter.emit('MULTI_EVENT', { msg: 'hello' });

      expect(handler1).toHaveBeenCalledWith({ msg: 'hello' });
      expect(handler2).toHaveBeenCalledWith({ msg: 'hello' });
    });

    it('should not interfere with other event types', () => {
      const handler = vi.fn();

      service.subscribe('EVENT_A', handler);
      eventEmitter.emit('EVENT_B', {});

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
