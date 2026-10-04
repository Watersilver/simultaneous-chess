import getInitialChessPosition from "../both/getInitialChessPosition.js";
import { ChessPosition, Turn } from "../both/Notation.js";
import { ReadonlyDeep } from "../both/ReadonlyDeep.js";

type RoomDataInit = {
  name: string;
  private: boolean;
}

type RoomData = RoomDataInit & {
  whiteId?: number;
  blackId?: number;
  people: number;
  turns: Turn[];
  pos: ChessPosition;
};

type RoomPropEntry = NonNullable<{
  [P in keyof RoomData]: [key: P, val: RoomData[P]]
}[keyof RoomData]>;

export default class DataAccess {
  private constructor() {}

  private static rooms: RoomData[] = [];

  static destroyRoom(roomName: string) {
    const i = DataAccess.rooms.findIndex(r => r.name === roomName);
    if (i !== -1) {
      DataAccess.rooms.splice(i, 1);
    }
  }

  static getRooms(includePrivate?: boolean): ReadonlyDeep<typeof DataAccess.rooms> {
    if (includePrivate) return DataAccess.rooms;
    return DataAccess.rooms.filter(r => !r.private);
  }

  static getRoom(roomName: string): ReadonlyDeep<RoomData> | null {
    return DataAccess.rooms.find(r => r.name === roomName) ?? null;
  }

  static doesRoomExist(roomName: string) {
    return DataAccess.rooms.some(room => room.name === roomName);
  }

  static createRoom(data: RoomDataInit) {
    if (DataAccess.doesRoomExist(data.name)) {
      return 'exists';
    }
    DataAccess.rooms.push({
      ...data,
      pos: getInitialChessPosition(),
      turns: [],
      people: 0
    });
    return 'success';
  }

  static setRoomProps(
    room: string,
    ...entries: RoomPropEntry[]
  ) {
    const rd = DataAccess.rooms.find(r => r.name === room);
    if (!rd) return;
    for (const [key, val] of entries) {
      (rd[key] as RoomData[typeof key]) = val;
    }
  }
}
