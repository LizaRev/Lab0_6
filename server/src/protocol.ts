export {
  PROTOCOL_VERSION,
  MESSAGE_TYPES,
  messageSchema,
  parseClientMessage,
} from "../../shared/protocol/messages.js";

export type {
  Message,
  ClientMessage,
  JoinMessage,
  LeaveMessage,
  ChatMessage,
  PingMessage,
  PongMessage,
  ErrorMessage,
  RosterMessage,
  InputMessage,
  SnapshotMessage,
  ParseResult,
} from "../../shared/protocol/messages.js";