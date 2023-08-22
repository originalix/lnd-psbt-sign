type EventBusCallBack<T> = (data: T) => void;
type EventBusMap = { [key: string]: Array<EventBusCallBack<any>> };

class EventBus {
  private events: EventBusMap;

  constructor() {
    this.events = {};
  }

  public subscribe<T>(eventName: string, callBack: EventBusCallBack<T>): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callBack);
  }

  public publish<T>(eventName: string, data: T): void {
    if (this.events[eventName]) {
      this.events[eventName].forEach((callBack: EventBusCallBack<T>) =>
        callBack(data)
      );
    }
  }

  public remove(eventName: string): void {
    delete this.events[eventName];
  }
}

export default new EventBus();
