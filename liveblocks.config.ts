declare global {
  interface Liveblocks {
    Presence: {
      name: string;
      avatar: string;
      color: string;
    };
    Storage: {};
    UserMeta: {
      id: string;
      info: {
        name: string;
        email: string;
        avatar: string;
        color: string;
      };
    };
    RoomEvent: {};
    ThreadMetadata: {
      taskId: string;
    };
    RoomInfo: {
      title: string;
    };
  }
}

export {};
