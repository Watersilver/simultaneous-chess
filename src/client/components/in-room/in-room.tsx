import { AppShell, Burger, Button, Group, Loader, Modal, Title, Text, Stack, Center } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useObservableState from '../../hooks/useObservableState';
import store from '../../store';
import clientSocket from '../../sockets/clientSocket';
import { useEffect, useState } from 'react';
import useMessageListener from '../../hooks/useMessageListener';

export default function InRoom({
  name
}: {
  name: string
}) {
  // Join room if not joined yet
  useEffect(() => {
    if (store.socketConnData.get().connectedToRoom !== name) {
      clientSocket.send({
        type: 'join-room',
        name,
        colour: store.autoRequestPlayInRoom.get() === name ? store.preferredColour.get() : undefined
      });
    }
  }, [name]);

  // Warn player that leaving will disconnect them
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const scd = store.socketConnData.get();
      if (scd.connectedToRoom === name && scd.colour !== null) {
        e.preventDefault();
      }
    };

    addEventListener('beforeunload', onBeforeUnload);

    return () => removeEventListener('beforeunload', onBeforeUnload);
  }, [name]);

  useMessageListener(clientSocket, {
    onMessage: msg => {
      switch (msg.type) {
        case 'join-room-fail':
          alert("Failed to connect to room");
          store.state.set({id: 'Lobby'});
          break;
        case 'leave-room-response':
          store.state.set({id: 'Lobby'});
          break;
      }
    }
  });

  const [connData] = useObservableState(store.socketConnData);

  const [opened, { toggle }] = useDisclosure();
  const [leaveDlgOpened, { open: leaveDlgOpen, close: leaveDlgClose }] = useDisclosure(false);
  const [leaving, setLeaving] = useState(false);

  return <>
    <Modal opened={leaveDlgOpened} onClose={leaveDlgClose} withCloseButton={false}>
      <Stack align='center'>
        <Text>Are you sure you want to leave?</Text>
        <Group>
          <Button color="red" variant='outline' onClick={() => {
            clientSocket.send({type: 'leave-room'});
            setLeaving(true);
          }}>
            Yes
          </Button>
          <Button variant='outline' onClick={leaveDlgClose}>No</Button>
        </Group>
      </Stack>
    </Modal>
    {
      connData.connectedToRoom === name && !leaving
      ? <AppShell
        padding="md"
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
      >
        <AppShell.Header>
          <Group h='100%' px='md'>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />

            <Title order={3}>{name}</Title>
            <Button color="red" variant='outline' style={{marginLeft: 'auto'}} onClick={() => {
              const scd = store.socketConnData.get();
              if (scd.connectedToRoom === name && scd.colour !== null) {
                leaveDlgOpen();
              } else {
                clientSocket.send({type: 'leave-room'});
                setLeaving(true);
              }
            }}>
              Leave
            </Button>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar>History</AppShell.Navbar>

        <AppShell.Main>Chessboard</AppShell.Main>
      </AppShell>
      : <Center>
        <Loader />
      </Center>
    }
  </>;
}