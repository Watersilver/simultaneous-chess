import { Button, Center, Container, Divider, Flex, Loader, TextInput, Notification, Stack, Title } from "@mantine/core";
import { useState } from "react";
import MatchList from "../match-list/match-list";
import useMessageListener from "../../hooks/useMessageListener";
import clientSocket from "../../sockets/clientSocket";
import store from "../../store";
import { notifications } from "@mantine/notifications";

type RoomData = {
  name: string;
}

export default function MatchSelection() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useMessageListener(clientSocket, {
    onMessage: msg => {
      switch (msg.type) {
        case 'join-room-fail':
          setLoading(false);
          notifications.show({
            message: msg.reason,
            color: 'red'
          });
          break;
        case 'join-room-success':
          setLoading(false);
          store.state.set({
            id: 'InRoom',
            name: msg.roomName
          });
          notifications.show({
            message: "You joined the room as spectator"
          });
          break;
      }
    }
  });

  const onSelectMatch = (data: RoomData) => {
    setLoading(true);
    clientSocket.send({type: 'join-room', name: data.name});
  };

  return <>
    <Center>
      <Stack>
        {
          loading
          ? <Loader />
          : <Container strategy="grid">
            <Title
              style={{position: 'absolute', top: 0}}
            >
              Simultaneous chess
            </Title>
            <Flex gap={8}>
              <TextInput
                placeholder="Room name"
                value={value}
                onChange={(event) => setValue(event.currentTarget.value)}
              />
              <Button
                disabled={!value}
                onClick={() => onSelectMatch({name: value})}
              >
                Enter
              </Button>
            </Flex>
            <Divider my="sm" />
            <MatchList search={value} onClick={onSelectMatch} />
          </Container>
        }
      </Stack>
    </Center>
  </>;
}