import {
  isValidKenyanPhone,
  formatKenyanPhone,
  sanitizeInput,
  isSafeHtml,
} from '../utils/security';

describe('Security Utils', () => {
  describe('isValidKenyanPhone', () => {
    it('should validate +254 format', () => {
      expect(isValidKenyanPhone('+254712345678')).toBe(true);
    });

    it('should validate 07 format', () => {
      expect(isValidKenyanPhone('0712345678')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidKenyanPhone('12345')).toBe(false);
      expect(isValidKenyanPhone('+1234567890')).toBe(false);
    });
  });

  describe('formatKenyanPhone', () => {
    it('should format 07 to +254', () => {
      expect(formatKenyanPhone('0712345678')).toBe('+254712345678');
    });

    it('should keep +254 format', () => {
      expect(formatKenyanPhone('+254712345678')).toBe('+254712345678');
    });

    it('should format 254 to +254', () => {
      expect(formatKenyanPhone('254712345678')).toBe('+254712345678');
    });
  });

  describe('isSafeHtml', () => {
    it('should detect script tags', () => {
      expect(isSafeHtml('<script>alert()</script>')).toBe(false);
    });

    it('should detect javascript: protocol', () => {
      expect(isSafeHtml('<a href="javascript:void(0)">Link</a>')).toBe(false);
    });

    it('should detect event handlers', () => {
      expect(isSafeHtml('<div onclick="alert()">Test</div>')).toBe(false);
    });

    it('should allow safe HTML', () => {
      expect(isSafeHtml('<div>Hello World</div>')).toBe(true);
    });
  });
});
