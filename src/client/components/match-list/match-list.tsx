import { Center, Flex, Paper, Text } from "@mantine/core";
import { Loader } from '@mantine/core';
import { MatchData } from "../../../both/MatchData";
import useAsyncState from "../../hooks/useAsyncState";

function ListItem({
  data,
  onClick
}: {
  data: MatchData;
  onClick: (data: MatchData) => void;
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
      name: {data.roomName}
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
  onClick: (data: MatchData) => void;
}) {
  const [list] = useAsyncState<MatchData[]>(async setProgress => {
    await new Promise(res => setTimeout(() => res(undefined), 1000));
    setProgress(0.5);
    await new Promise(res => setTimeout(() => res(undefined), 1000));
    return [{
      roomName: 'erty',
      players: 2,
      viewers: 1
    }, {
      roomName: 'test',
      players: 1,
      viewers: 0
    }, {
      roomName: 'trsast',
      players: 0,
      viewers: 20
    }]
  });

  return <Flex direction='column' gap={8}>
    {
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
    }
  </Flex>
}