import { Button, Center, Container, Divider, Flex, Loader, TextInput, Notification, Stack } from "@mantine/core";
import { useState } from "react";
import MatchList from "../match-list/match-list";
import useMessageListener from "../../hooks/useMessageListener";
import clientSocket from "../../sockets/clientSocket";
import store from "../../store";

type RoomData = {
  name: string;
}

export default function MatchSelection() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useMessageListener(clientSocket, {
    onMessage: msg => {
      switch (msg.type) {
        case 'join-room-fail':
          setLoading(false);
          setErrorMsg(msg.reason);
          break;
        case 'join-room-success':
          setLoading(false);
          store.state.set({
            id: 'InRoom',
            name: msg.roomName
          })
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
            <Flex gap={8}>
              <TextInput
                placeholder="Room name"
                value={value}
                onChange={(event) => setValue(event.currentTarget.value)}
              />
              <Button
                onClick={() => onSelectMatch({name: value})}
              >
                Enter
              </Button>
            </Flex>
            <Divider my="sm" />
            <MatchList search={value} onClick={onSelectMatch} />
          </Container>
        }
        {
          errorMsg === ""
          ? null
          : <Notification color="red" title="Connection failed" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Notification>
        }
      </Stack>
    </Center>
  </>;
}