import { DebugEvent } from '../types';

type EventListener = (e: DebugEvent) => void;

export class Target {
  private listeners: EventListener[] = [];

  public addEventListener = (l: EventListener) => {
    this.listeners = [...this.listeners, l];
  };

  public removeEventListener = (l: EventListener) => {
    this.listeners = this.listeners.filter(listener => listener !== l);
  };

  public dispatchEvent = (e: DebugEvent) => {
    this.listeners.forEach(l => l(e));
  };
}
