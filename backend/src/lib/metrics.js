const metrics = {
  httpRequestsTotal: 0,
  httpRequestsByRoute: new Map(),
  messageSendAttempts: 0,
  messageSendSuccess: 0,
  messageSendFailures: 0,
  socketConnections: 0,
  socketReconnects: 0,
  socketDisconnects: 0,
};

const routeKey = (method, route, statusCode) => `${method} ${route} ${statusCode}`;

export const incrementMetric = (key, value = 1) => {
  metrics[key] = Number(metrics[key] || 0) + value;
};

export const recordHttpMetric = ({ method, route, statusCode }) => {
  metrics.httpRequestsTotal += 1;
  const key = routeKey(method, route, statusCode);
  metrics.httpRequestsByRoute.set(key, Number(metrics.httpRequestsByRoute.get(key) || 0) + 1);
};

export const getMetricsSnapshot = () => ({
  httpRequestsTotal: metrics.httpRequestsTotal,
  httpRequestsByRoute: Object.fromEntries(metrics.httpRequestsByRoute.entries()),
  messageSendAttempts: metrics.messageSendAttempts,
  messageSendSuccess: metrics.messageSendSuccess,
  messageSendFailures: metrics.messageSendFailures,
  socketConnections: metrics.socketConnections,
  socketReconnects: metrics.socketReconnects,
  socketDisconnects: metrics.socketDisconnects,
});

