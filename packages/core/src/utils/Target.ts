import { DebugEvent, DebugEventTypes } from '../types';

type EventListener = <T extends keyof DebugEventTypes | string>(
  e: DebugEvent<T>
) => void;

export class Target {
  private listeners: EventListener[] = [];

  public addEventListener = (l: EventListener) => {
    this.listeners = [...this.listeners, l];
  };

  public removeEventListener = (l: EventListener) => {
    this.listeners = this.listeners.filter(listener => listener !== l);
  };

  public dispatchEvent = <T extends string | keyof DebugEventTypes>(
    e: DebugEvent<T>
  ) => {
    this.listeners.forEach(l => {
      l(e)
    });
  };
}
