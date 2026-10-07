import {
  useEffect,
  useState,
} from "react";
import type { Lobby } from "../lobby.js";

type Room = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type LobbyEventDetail = {
  rooms?: Room[];
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

  if (
    !("name" in value) ||
    typeof value.name !== "string"
  ) {
    return false;
  }

  return true;
}

function getLobbyEventDetail(
  value: unknown
): LobbyEventDetail | undefined {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return undefined;
  }

  if (
    !("rooms" in value) ||
    !Array.isArray(value.rooms)
  ) {
    return undefined;
  }

  return {
    rooms: value.rooms.filter(isRoom),
  };
}

type LobbyProps = {
  lobby: Lobby;
  onJoined: () => void;
};

export function LobbyComponent({
  lobby,
  onJoined,
}: LobbyProps) {
  const [name, setName] =
    useState("");

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [selectedRoomId, setSelectedRoomId] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState("Loading rooms...");

  useEffect(() => {
    function handleRoomsUpdated(
      event: Event
    ): void {
      if (
        !(event instanceof CustomEvent)
      ) {
        return;
      }

      const detail =
        getLobbyEventDetail(
          event.detail
        );

      const nextRooms =
        detail?.rooms ?? [];

      setRooms(nextRooms);
      setSelectedRoomId(null);

      if (nextRooms.length === 0) {
        setStatus(
          "No rooms available"
        );
      } else {
        setStatus(
          "Select an arena"
        );
      }
    }

    function handleJoined(): void {
      onJoined();
    }

    lobby.addEventListener(
      "roomsUpdated",
      handleRoomsUpdated
    );

    lobby.addEventListener(
      "joined",
      handleJoined
    );

    return () => {
      lobby.removeEventListener(
        "roomsUpdated",
        handleRoomsUpdated
      );

      lobby.removeEventListener(
        "joined",
        handleJoined
      );
    };
  }, [
    lobby,
    onJoined,
  ]);

  useEffect(() => {
    lobby.startAutoRefresh();

    return () => {
      lobby.stopAutoRefresh();
    };
  }, [lobby]);

  const canJoin =
    Boolean(
      name.trim() &&
      selectedRoomId
    );

  function handleNameChange(
    value: string
  ): void {
    setName(value);

    lobby.setPlayerName(
      value
    );
  }

  function handleJoin(): void {
    if (!selectedRoomId) {
      return;
    }

    lobby.setPlayerName(
      name
    );

    lobby.join(
      selectedRoomId
    );
  }

  function selectRoom(
    room: Room
  ): void {
    setSelectedRoomId(
      room.id
    );

    setStatus(
      `${room.name} selected`
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundImage: `
          linear-gradient(
            rgba(100, 75, 150, 0.28),
            rgba(80, 55, 130, 0.38)
          ),
          url("/api/background.jpg")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#29233d",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(520px, 90vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "42px",
          boxSizing: "border-box",
          background:
            "rgba(255, 255, 255, 0.78)",
          backdropFilter:
            "blur(24px)",
          WebkitBackdropFilter:
            "blur(24px)",
          border:
            "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "28px",
          boxShadow:
            "0 25px 70px rgba(55, 40, 100, 0.35)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "4px",
            color: "#8b72c9",
            marginBottom: "8px",
          }}
        >
          SPACE ARENA
        </div>

        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#30264a",
          }}
        >
          Choose your arena
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#756b89",
            fontSize: "14px",
            margin: "10px 0 30px",
          }}
        >
          Enter your name and choose a room to start playing.
        </p>

        <label
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "#756b89",
            marginBottom: "8px",
          }}
        >
          PLAYER NAME
        </label>

        <input
          type="text"
          placeholder="Enter your name"
          maxLength={20}
          value={name}
          onChange={(event) =>
            handleNameChange(
              event.target.value
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 16px",
            border:
              "1px solid #ddd4ef",
            borderRadius: "14px",
            background:
              "rgba(255, 255, 255, 0.85)",
            color: "#30264a",
            fontSize: "15px",
            outline: "none",
          }}
        />

        <div
          style={{
            marginTop: "28px",
            marginBottom: "12px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "#756b89",
          }}
        >
          AVAILABLE ROOMS
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {rooms.map(
            (room) => {
              const selected =
                selectedRoomId ===
                room.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() =>
                    selectRoom(
                      room
                    )
                  }
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "15px 16px",
                    border:
                      selected
                        ? "2px solid #a78bdf"
                        : "1px solid #e1d9ef",
                    borderRadius:
                      "16px",
                    background:
                      selected
                        ? "linear-gradient(135deg, #eee7ff, #e2d8fa)"
                        : "rgba(255, 255, 255, 0.65)",
                    color:
                      "#30264a",
                    textAlign:
                      "left",
                    cursor:
                      "pointer",
                    boxShadow:
                      selected
                        ? "0 6px 18px rgba(118, 84, 184, 0.15)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "15px",
                        fontWeight:
                          700,
                      }}
                    >
                      {
                        room.name
                      }
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize:
                        "11px",
                      marginTop:
                        "5px",
                      color:
                        "#91879e",
                    }}
                  >
                    Ready to join
                  </div>
                </button>
              );
            }
          )}
        </div>

        <button
          type="button"
          disabled={!canJoin}
          onClick={handleJoin}
          style={{
            width: "100%",
            marginTop: "24px",
            padding: "15px",
            border: "none",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            cursor: canJoin
              ? "pointer"
              : "default",
            background: canJoin
              ? "linear-gradient(135deg, #9b7bd3, #7654b8)"
              : "#e4dff0",
            color: canJoin
              ? "white"
              : "#a29aaf",
            boxShadow: canJoin
              ? "0 8px 20px rgba(118, 84, 184, 0.28)"
              : "none",
          }}
        >
          JOIN ARENA →
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#8b8198",
            marginTop: "16px",
          }}
        >
          {status}
        </p>
      </div>
    </div>
  );
}