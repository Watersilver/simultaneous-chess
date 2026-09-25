import { Button, Center, Flex, Paper, Text } from "@mantine/core";
import { Loader } from '@mantine/core';
import store from "../../store";
import useRequest from "../../hooks/useRequest";
import requestRoomsList from "../../requests/requestRoomsList";
import { RoomsListResponseSchema } from "../../../both/protocol";
import { useEffect } from "react";

type RoomData = {
  name: string;
  viewers: number;
  players: number;
}

function ListItem({
  data,
  onClick
}: {
  data: RoomData;
  onClick: (data: RoomData) => void;
}) {
  return <Paper
    withBorder
    p='sm'
    onClick={() => {
      onClick(data);
    }}
    style={{cursor: 'pointer'}}
  >
    <Text fw={700}>
      name: {data.name}
    </Text>
    <Text size="xs" c="dimmed">
      players: {data.players ?? "?"}/2 | viewers: {data.viewers ?? "?"}
    </Text>
  </Paper>;
}

export default function MatchList({
  search,
  onClick
}: {
  search: string;
  onClick: (data: RoomData) => void;
}) {
  const [roomsList, sendRoomsListReq] = useRequest(requestRoomsList);

  useEffect(() => {
    sendRoomsListReq();
    store.autoRequestPlayInRoom.set("");
  }, []);

  return <Flex direction='column' gap={8}>
    {
      roomsList.status === "loading"
      ? <Center><Loader /></Center>
      : roomsList.status === 'ok' && RoomsListResponseSchema.validate(roomsList.data)
      ? roomsList.data.filter(
        l => l.name.includes(search)
      ).sort(
        (a, b) => b.name.startsWith(search) && !a.name.startsWith(search) ? 1 : -1
      ).map(l => {
        return <ListItem key={l.name} data={l} onClick={onClick} />
      })
      : null
    }
    <Button onClick={sendRoomsListReq}>Refresh</Button>
    {/* {
      list.status === "ok"
      ? list.data.filter(
        l => l.roomName.includes(search)
      ).sort(
        (a, b) => b.roomName.startsWith(search) && !a.roomName.startsWith(search) ? 1 : -1
      ).map(l => {
        return <ListItem key={l.roomName} data={l} onClick={onClick} />
      })
      : list.status === "loading"
      ? <Center><Loader /></Center>
      : list.status === "error"
      ? list.error instanceof Error ? list.error.message : "Something went wrong"
      : "never"
    } */}
  </Flex>
}