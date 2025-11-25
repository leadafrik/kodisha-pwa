import { handleApiError, apiCall } from '../utils/errorHandler';

describe('Error Handler', () => {
  describe('handleApiError', () => {
    it('should handle network errors', () => {
      const error = { message: 'Network Error' };
      const result = handleApiError(error);
      
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('No internet connection');
    });

    it('should handle 401 unauthorized', () => {
      const error = {
        response: { status: 401, data: { message: 'Unauthorized' } },
      };
      const result = handleApiError(error);
      
      expect(result.status).toBe(401);
      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('should handle 404 not found', () => {
      const error = {
        response: { status: 404, data: {} },
      };
      const result = handleApiError(error);
      
      expect(result.status).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle 500 server errors', () => {
      const error = {
        response: { status: 500, data: {} },
      };
      const result = handleApiError(error);
      
      expect(result.status).toBe(500);
      expect(result.code).toBe('SERVER_ERROR');
    });
  });

  describe('apiCall', () => {
    it('should return data on success', async () => {
      const mockFn = jest.fn().mockResolvedValue({ data: 'test' });
      const result = await apiCall(mockFn);
      
      expect(result).toEqual({ data: 'test' });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockErrorHandler = jest.fn();
      
      const result = await apiCall(mockFn, mockErrorHandler);
      
      expect(result).toBeNull();
      expect(mockErrorHandler).toHaveBeenCalled();
    });
  });
});
