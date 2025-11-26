const reportWebVitals = (onPerfEntry?: any) => {
  if (typeof onPerfEntry === 'function') {
    try {
      const perf = window.performance;
      const timing = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      onPerfEntry({
        type: 'navigation',
        domContentLoaded: timing?.domContentLoadedEventEnd || 0,
        load: timing?.loadEventEnd || 0,
        firstPaint: perf.getEntriesByName('first-paint')[0]?.startTime || 0,
      });
    } catch {
      /* silent */
    }
  }
};

export default reportWebVitals;