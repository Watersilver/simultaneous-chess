import { Button, Center, Container, Divider, Flex, TextInput } from "@mantine/core";
import { useState } from "react";
import MatchList from "../match-list/match-list";
import { MatchData } from "../../../both/MatchData";
import requestRoom from "../../requests/requestRoom";
import clientSocket from "../../sockets/clientSocket";

export default function MatchSelection() {
  const [value, setValue] = useState('');

  const onClick = (data: MatchData) => {
    clientSocket.send(data.roomName)
  };

  return <>
    <Center>
      <Container strategy="grid">
        <Flex>
          <TextInput
            placeholder="Room name"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
          />
          <Button
            onClick={() => onClick({roomName: value})}
          >Enter</Button>
        </Flex>
        <Divider my="sm" />
        <MatchList search={value} onClick={onClick} />
      </Container>
    </Center>
  </>
}