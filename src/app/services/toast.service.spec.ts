/**
 * 🧪 Toast Service Tests
 * Testes unitários para o ToastService
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ToastService, ToastOptions, Toast, ToastConfig } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
    jasmine.clock().install();
  });

  afterEach(() => {
    service.dismissAll();
    jasmine.clock().uninstall();
  });

  // ===== INITIALIZATION =====

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty toasts', () => {
      expect(service.toasts()).toEqual([]);
    });

    it('should have count of 0 initially', () => {
      expect(service.count()).toBe(0);
    });

    it('should have hasToasts as false initially', () => {
      expect(service.hasToasts()).toBe(false);
    });
  });

  // ===== SHOW METHOD =====

  describe('show()', () => {
    it('should add a toast', () => {
      service.show({ message: 'Test message' });
      expect(service.toasts().length).toBe(1);
    });

    it('should return toast id', () => {
      const id = service.show({ message: 'Test' });
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should generate unique ids', () => {
      const id1 = service.show({ message: 'Test 1' });
      const id2 = service.show({ message: 'Test 2' });
      expect(id1).not.toBe(id2);
    });

    it('should set default duration', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(4000);
    });

    it('should set custom duration', () => {
      service.show({ message: 'Test', duration: 10000 });
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(10000);
    });

    it('should set default position', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.position).toBe('top');
    });

    it('should set custom position', () => {
      service.show({ message: 'Test', position: 'bottom-right' });
      const toast = service.toasts()[0];
      expect(toast.position).toBe('bottom-right');
    });

    it('should set default color as primary', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.color).toBe('primary');
    });

    it('should set custom color', () => {
      service.show({ message: 'Test', color: 'success' });
      const toast = service.toasts()[0];
      expect(toast.color).toBe('success');
    });

    it('should set dismissible as true by default', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.dismissible).toBe(true);
    });

    it('should set icon if provided', () => {
      service.show({ message: 'Test', icon: '🎉' });
      const toast = service.toasts()[0];
      expect(toast.icon).toBe('🎉');
    });

    it('should set action if provided', () => {
      const handler = jasmine.createSpy('handler');
      service.show({ message: 'Test', action: { label: 'Undo', handler } });
      const toast = service.toasts()[0];
      expect(toast.action?.label).toBe('Undo');
    });

    it('should add toast at beginning of list', () => {
      service.show({ message: 'First' });
      service.show({ message: 'Second' });
      expect(service.toasts()[0].message).toBe('Second');
      expect(service.toasts()[1].message).toBe('First');
    });

    it('should set createdAt timestamp', () => {
      const before = new Date();
      service.show({ message: 'Test' });
      const after = new Date();
      const toast = service.toasts()[0];
      expect(toast.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(toast.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ===== CONVENIENCE METHODS =====

  describe('success()', () => {
    it('should create success toast', () => {
      service.success('Success!');
      const toast = service.toasts()[0];
      expect(toast.color).toBe('success');
    });

    it('should set success icon', () => {
      service.success('Success!');
      const toast = service.toasts()[0];
      expect(toast.icon).toBe('✅');
    });

    it('should set 3000ms duration', () => {
      service.success('Success!');
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(3000);
    });

    it('should allow overriding options', () => {
      service.success('Success!', { duration: 5000, icon: '🎉' });
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(5000);
      expect(toast.icon).toBe('🎉');
    });
  });

  describe('error()', () => {
    it('should create error toast', () => {
      service.error('Error!');
      const toast = service.toasts()[0];
      expect(toast.color).toBe('danger');
    });

    it('should set error icon', () => {
      service.error('Error!');
      const toast = service.toasts()[0];
      expect(toast.icon).toBe('❌');
    });

    it('should set 5000ms duration', () => {
      service.error('Error!');
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(5000);
    });
  });

  describe('warning()', () => {
    it('should create warning toast', () => {
      service.warning('Warning!');
      const toast = service.toasts()[0];
      expect(toast.color).toBe('warning');
    });

    it('should set warning icon', () => {
      service.warning('Warning!');
      const toast = service.toasts()[0];
      expect(toast.icon).toBe('⚠️');
    });

    it('should set 4000ms duration', () => {
      service.warning('Warning!');
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(4000);
    });
  });

  describe('info()', () => {
    it('should create info toast', () => {
      service.info('Info!');
      const toast = service.toasts()[0];
      expect(toast.color).toBe('primary');
    });

    it('should set info icon', () => {
      service.info('Info!');
      const toast = service.toasts()[0];
      expect(toast.icon).toBe('ℹ️');
    });

    it('should set 4000ms duration', () => {
      service.info('Info!');
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(4000);
    });
  });

  // ===== DISMISS METHODS =====

  describe('dismiss()', () => {
    it('should remove specific toast', () => {
      const id1 = service.show({ message: 'Toast 1' });
      const id2 = service.show({ message: 'Toast 2' });

      service.dismiss(id1);

      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0].id).toBe(id2);
    });

    it('should handle non-existent id gracefully', () => {
      service.show({ message: 'Test' });
      expect(() => service.dismiss('non-existent')).not.toThrow();
      expect(service.toasts().length).toBe(1);
    });

    it('should update count after dismiss', () => {
      const id = service.show({ message: 'Test' });
      expect(service.count()).toBe(1);
      service.dismiss(id);
      expect(service.count()).toBe(0);
    });
  });

  describe('dismissAll()', () => {
    it('should remove all toasts', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      service.show({ message: 'Toast 3' });

      service.dismissAll();

      expect(service.toasts().length).toBe(0);
    });

    it('should work when no toasts exist', () => {
      expect(() => service.dismissAll()).not.toThrow();
    });
  });

  // ===== AUTO-DISMISS =====

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after duration', () => {
      service.show({ message: 'Test', duration: 3000 });
      expect(service.toasts().length).toBe(1);

      jasmine.clock().tick(3000);

      expect(service.toasts().length).toBe(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      service.show({ message: 'Test', duration: 0 });
      expect(service.toasts().length).toBe(1);

      jasmine.clock().tick(10000);

      expect(service.toasts().length).toBe(1);
    });

    it('should clear timeout on manual dismiss', () => {
      const id = service.show({ message: 'Test', duration: 5000 });

      // Dismiss manually before timeout
      service.dismiss(id);

      // Advance past original duration
      jasmine.clock().tick(5000);

      // Should not throw or cause issues
      expect(service.toasts().length).toBe(0);
    });

    it('should dismiss toasts independently', () => {
      service.show({ message: 'Short', duration: 1000 });
      service.show({ message: 'Long', duration: 5000 });

      jasmine.clock().tick(1000);
      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0].message).toBe('Long');

      jasmine.clock().tick(4000);
      expect(service.toasts().length).toBe(0);
    });
  });

  // ===== MAX TOASTS LIMIT =====

  describe('Max toasts limit', () => {
    it('should respect maxToasts limit', () => {
      for (let i = 0; i < 10; i++) {
        service.show({ message: `Toast ${i}`, duration: 0 });
      }

      expect(service.toasts().length).toBe(5); // default maxToasts
    });

    it('should keep newest toasts when exceeding limit', () => {
      for (let i = 0; i < 7; i++) {
        service.show({ message: `Toast ${i}`, duration: 0 });
      }

      const messages = service.toasts().map((t) => t.message);
      expect(messages).toContain('Toast 6');
      expect(messages).toContain('Toast 5');
      expect(messages).not.toContain('Toast 0');
    });
  });

  // ===== CONFIGURATION =====

  describe('configure()', () => {
    it('should change default duration', () => {
      service.configure({ defaultDuration: 10000 });
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(10000);
    });

    it('should change default position', () => {
      service.configure({ defaultPosition: 'bottom-right' });
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.position).toBe('bottom-right');
    });

    it('should change maxToasts', () => {
      service.configure({ maxToasts: 3 });
      for (let i = 0; i < 5; i++) {
        service.show({ message: `Toast ${i}`, duration: 0 });
      }
      expect(service.toasts().length).toBe(3);
    });

    it('should allow partial config', () => {
      service.configure({ defaultDuration: 8000 });
      // Other defaults should remain
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast.duration).toBe(8000);
      expect(toast.position).toBe('top'); // unchanged
    });
  });

  // ===== UTILITY METHODS =====

  describe('getToast()', () => {
    it('should return toast by id', () => {
      const id = service.show({ message: 'Test' });
      const toast = service.getToast(id);
      expect(toast).toBeTruthy();
      expect(toast?.message).toBe('Test');
    });

    it('should return undefined for non-existent id', () => {
      const toast = service.getToast('non-existent');
      expect(toast).toBeUndefined();
    });
  });

  describe('updateMessage()', () => {
    it('should update toast message', () => {
      const id = service.show({ message: 'Original' });
      service.updateMessage(id, 'Updated');
      const toast = service.getToast(id);
      expect(toast?.message).toBe('Updated');
    });

    it('should not affect other toasts', () => {
      const id1 = service.show({ message: 'Toast 1' });
      const id2 = service.show({ message: 'Toast 2' });

      service.updateMessage(id1, 'Updated');

      expect(service.getToast(id1)?.message).toBe('Updated');
      expect(service.getToast(id2)?.message).toBe('Toast 2');
    });

    it('should handle non-existent id gracefully', () => {
      expect(() => service.updateMessage('non-existent', 'Test')).not.toThrow();
    });
  });

  // ===== COMPUTED SIGNALS =====

  describe('Computed signals', () => {
    it('should update count when adding toasts', () => {
      expect(service.count()).toBe(0);
      service.show({ message: 'Test 1' });
      expect(service.count()).toBe(1);
      service.show({ message: 'Test 2' });
      expect(service.count()).toBe(2);
    });

    it('should update hasToasts correctly', () => {
      expect(service.hasToasts()).toBe(false);
      const id = service.show({ message: 'Test' });
      expect(service.hasToasts()).toBe(true);
      service.dismiss(id);
      expect(service.hasToasts()).toBe(false);
    });
  });

  // ===== EDGE CASES =====

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      const id = service.show({ message: '' });
      expect(service.getToast(id)?.message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const id = service.show({ message: longMessage });
      expect(service.getToast(id)?.message).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const message = '<script>alert("XSS")</script>';
      const id = service.show({ message });
      expect(service.getToast(id)?.message).toBe(message);
    });

    it('should handle unicode in message', () => {
      const message = '🎉 Sucesso! 中文 العربية';
      const id = service.show({ message });
      expect(service.getToast(id)?.message).toBe(message);
    });

    it('should handle rapid show/dismiss cycles', () => {
      for (let i = 0; i < 100; i++) {
        const id = service.show({ message: `Toast ${i}`, duration: 0 });
        service.dismiss(id);
      }
      expect(service.toasts().length).toBe(0);
    });

    it('should handle action handler execution', () => {
      const handler = jasmine.createSpy('handler');
      service.show({
        message: 'Test',
        action: { label: 'Click', handler }
      });

      const toast = service.toasts()[0];
      toast.action?.handler();

      expect(handler).toHaveBeenCalled();
    });
  });
});
