import { decodeBinaryMessage } from "../../shared/protocol/binary.js";
import {
  parseMessage,
  type Message,
} from "../../shared/protocol/messages.js";

const DEFAULT_RECONNECT_DELAYS: number[] = [
  500,
  1000,
  2000,
  4000,
  8000,
  15000
];

type ConnectionOptions = {
  url?: string;
  reconnectDelays?: number[];
  onmessage?: ((message: Message) => void) | null;
  onopen?: (() => void) | null;
  onclose?: ((event: CloseEvent) => void) | null;
  onerror?: ((event: Event | Error) => void) | null;
};

export class Connection {
  url: string;
  reconnectDelays: number[];

  onmessage: ((message: Message) => void) | null;
  onopen: (() => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event | Error) => void) | null;

  socket: WebSocket | null;
  queue: string[];
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  closedManually: boolean;

  constructor({
    url = "/ws",
    reconnectDelays = DEFAULT_RECONNECT_DELAYS,
    onmessage = null,
    onopen = null,
    onclose = null,
    onerror = null,
  }: ConnectionOptions = {}) {
    this.url = url;
    this.reconnectDelays = reconnectDelays;

    this.onmessage = onmessage;
    this.onopen = onopen;
    this.onclose = onclose;
    this.onerror = onerror;

    this.socket = null;
    this.queue = [];
    this.reconnectAttempt = 0;
    this.reconnectTimer = null;
    this.closedManually = false;
  }

  connect(): void {
    this.closedManually = false;

    if (
      this.socket &&
      (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    this.clearReconnectTimer();

    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (socket !== this.socket) {
        return;
      }

      this.reconnectAttempt = 0;
      this.flushQueue();

      this.onopen?.();
    });

    socket.addEventListener("message", async (event: MessageEvent) => {
      if (socket !== this.socket) {
        return;
      }

      let message: Message;

      try {
        console.log(
          "WS DATA:",
          typeof event.data,
          event.data?.constructor?.name
        );

        if (event.data instanceof ArrayBuffer) {
          message = decodeBinaryMessage(event.data);
        } else if (
          event.data &&
          typeof event.data.arrayBuffer === "function"
        ) {
          const buffer = await event.data.arrayBuffer();
          message = decodeBinaryMessage(buffer);
        } else if (typeof event.data === "string") {
          const result = parseMessage(
            JSON.parse(event.data)
          );

          if (!result.ok) {
            throw new Error(result.error);
          }

          message = result.message;
        } else {
          throw new Error(
            `Unsupported WebSocket data type: ${typeof event.data}`
          );
        }

      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        this.onerror?.(
          new Error(
            `Failed to decode WebSocket message: ${message}`
          )
        );

        return;
      }

      this.onmessage?.(message);
    });

    socket.addEventListener("error", (event: Event) => {
      if (socket !== this.socket) {
        return;
      }

      this.onerror?.(event);
    });

    socket.addEventListener("close", (event: CloseEvent) => {
      if (socket !== this.socket) {
        return;
      }

      this.socket = null;
      this.onclose?.(event);

      if (!this.closedManually) {
        this.scheduleReconnect();
      }
    });
  }

  send(message: unknown): boolean {
    const encoded = JSON.stringify(message);

    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.socket.send(encoded);
      return true;
    }

    this.queue.push(encoded);

    this.connect();

    return false;
  }

  close(): void {
    this.closedManually = true;
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  scheduleReconnect(): void {
    if (this.closedManually || this.reconnectTimer) {
      return;
    }

    const index = Math.min(
      this.reconnectAttempt,
      this.reconnectDelays.length - 1
    );

    const delay = this.reconnectDelays[index];

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  flushQueue(): void {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    while (this.queue.length > 0) {
      const message = this.queue.shift();

      if (message !== undefined) {
        this.socket.send(message);
      }
    }
  }

  clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}