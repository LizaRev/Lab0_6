import { Connection } from "./connection.js";
import type { Message } from "../../shared/protocol/messages.js";

const PROTOCOL_VERSION = 1;

type Room = {
  id: string;
  name?: string;
  arena?: unknown;
  [key: string]: unknown;
};

function isRoom(
  value: unknown
): value is Room {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  if (
    !("id" in value) ||
    typeof value.id !== "string"
  ) {
    return false;
  }

  return true;
}

function getRooms(
  data: unknown
): Room[] {
  if (Array.isArray(data)) {
    return data.filter(isRoom);
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "rooms" in data
  ) {
    const rooms =
      data.rooms;

    return Array.isArray(rooms)
      ? rooms.filter(isRoom)
      : [];
  }

  return [];
}

export class Lobby extends EventTarget {
  rooms: Room[];
  playerName: string;

  controller: AbortController | null;
  refreshTimer: ReturnType<typeof setInterval> | null;

  connection: Connection;

  currentRoomId: string | null;
  currentRoom: Room | null;

  constructor() {
    super();

    this.rooms = [];
    this.playerName = "";

    this.controller = null;
    this.refreshTimer = null;

    this.connection = new Connection({
      url: "/ws",

      onopen: () => {
        this.dispatchEvent(
          new CustomEvent("connectionOpen")
        );

        if (this.currentRoomId) {
          this.sendJoin();
        }
      },

      onmessage: (message) => {
        this.handleMessage(
          message
        );
      },

      onclose: () => {
        this.dispatchEvent(
          new CustomEvent("connectionClose")
        );
      },

      onerror: (error) => {
        console.error(
          "WebSocket error:",
          error
        );

        this.dispatchEvent(
          new CustomEvent("connectionError", {
            detail: { error },
          })
        );
      },
    });

    this.currentRoomId = null;
    this.currentRoom = null;
  }

  setPlayerName(name: string): void {
    this.playerName =
      name.trim().slice(0, 20);
  }

  async refresh(): Promise<Room[] | undefined> {
    if (this.controller) {
      this.controller.abort();
    }

    this.controller =
      new AbortController();

    const controller =
      this.controller;

    try {
      const response =
        await fetch("/api/rooms", {
          signal: controller.signal,
        });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data: unknown =
        await response.json();

      const rooms =
        getRooms(data);

      this.rooms =
        rooms;

      this.dispatchEvent(
        new CustomEvent("roomsUpdated", {
          detail: {
            rooms: this.rooms,
          },
        })
      );

      return this.rooms;
    } catch (error: unknown) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Не вдалося завантажити кімнати:",
        error
      );

      this.dispatchEvent(
        new CustomEvent("roomsError", {
          detail: { error },
        })
      );
    }
  }

  startAutoRefresh(interval = 5000): void {
    this.stopAutoRefresh();

    this.refresh();

    this.refreshTimer =
      setInterval(() => {
        this.refresh();
      }, interval);

    this.connection.connect();
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(
        this.refreshTimer
      );

      this.refreshTimer = null;
    }

    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  join(roomId: string): void {
    const room =
      this.rooms.find(
        (item) => item.id === roomId
      );

    if (!room) {
      throw new Error(
        `Кімнату ${roomId} не знайдено`
      );
    }

    if (!this.playerName) {
      throw new Error(
        "Player name is required"
      );
    }

    this.currentRoomId =
      room.id;

    this.currentRoom =
      room;

    this.stopAutoRefresh();

    this.connection.connect();

    if (
      this.connection.socket &&
      this.connection.socket.readyState ===
        WebSocket.OPEN
    ) {
      this.sendJoin();
    }
  }

  sendJoin(): void {
    if (!this.currentRoomId) {
      return;
    }

    this.connection.send({
      version: PROTOCOL_VERSION,
      type: "join",
      roomId: this.currentRoomId,
      name:
        this.playerName || "Guest",
    });
  }

  leave(): void {
    this.connection.send({
      version: PROTOCOL_VERSION,
      type: "leave",
    });

    this.currentRoomId = null;
    this.currentRoom = null;
  }

  sendChat(text: string): void {
    const value =
      text.trim();

    if (!value) {
      return;
    }

    this.connection.send({
      version: PROTOCOL_VERSION,
      type: "chat",
      text: value,
    });
  }

  handleMessage(
    message: Message
  ): void {
    switch (message.type) {
      case "roster":
        this.handleRoster(message);
        break;

      case "chat":
        this.dispatchEvent(
          new CustomEvent("chat", {
            detail: message,
          })
        );
        break;

      case "pong":
        this.dispatchEvent(
          new CustomEvent("pong", {
            detail: message,
          })
        );
        break;

      case "snapshot":
        this.dispatchEvent(
          new CustomEvent("snapshot", {
            detail: message,
          })
        );
        break;

      case "error":
        console.error(
          "Server error:",
          message.error
        );

        this.dispatchEvent(
          new CustomEvent("serverError", {
            detail: message,
          })
        );
        break;

      default:
        console.warn(
          "Unknown server message:",
          message
        );
    }
  }

  handleRoster(
    message: Extract<
      Message,
      { type: "roster" }
    >
  ): void {
    const roomId =
      typeof message.roomId === "string"
        ? message.roomId
        : null;

    if (
      this.currentRoomId &&
      roomId !== this.currentRoomId
    ) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("roster", {
        detail: message,
      })
    );

    if (
      this.currentRoomId &&
      roomId === this.currentRoomId
    ) {
      this.dispatchEvent(
        new CustomEvent("joined", {
          detail: {
            room: this.currentRoom,
            playerName:
              this.playerName,
            players:
              message.players,
          },
        })
      );
    }
  }

  destroy(): void {
    this.stopAutoRefresh();
    this.connection.close();
  }
}