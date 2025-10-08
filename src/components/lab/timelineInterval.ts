export type TickHandler = () => void;

export function startTimelineInterval(handler: TickHandler, speed = 1) {
  const ms = Math.max(20, Math.round(200 / (speed || 1)));
  const id = window.setInterval(handler, ms);
  return id;
}

export function stopTimelineInterval(id: number | null) {
  if (id !== null) {
    clearInterval(id);
  }
}
