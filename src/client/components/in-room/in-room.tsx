import { AppShell, Burger, Button, Group, Loader, Modal, Title, Text, Stack, Center, Box, SimpleGrid } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useObservableState from '../../hooks/useObservableState';
import store from '../../store';
import clientSocket from '../../sockets/clientSocket';
import { useEffect, useState } from 'react';
import useMessageListener from '../../hooks/useMessageListener';
import { notifications } from '@mantine/notifications';

function RoleDisplay({
  onJoinRequest,
  joinable,
  requestingPlay
}: {
  joinable?: boolean;
  onJoinRequest?: () => void;
  requestingPlay?: boolean;
}) {
  joinable = true;
  const [connData] = useObservableState(store.socketConnData);

  return <SimpleGrid style={{
    justifyItems: 'center'
  }}>
    {
      requestingPlay
      ? <Loader size='xs' />
      : <Text
        fw={700}
        fs={connData.colour ? undefined : "italic"}
        c={connData.colour ? undefined : 'dimmed'}
        size='xl'
        style={{
          textShadow: connData.colour === 'black'
          ? "1px 1px white, -1px 1px white, 1px -1px white, -1px -1px white"
          : connData.colour === 'white'
          ? "1px 1px black, -1px 1px black, 1px -1px black, -1px -1px black"
          : undefined,
          color: connData.colour ?? undefined
        }}
      >
        {
          connData.colour === 'black'
          ? "Black"
          : connData.colour === 'white'
          ? "White"
          : <>
            Spectator
            {
              joinable
              ? <Button ml='md' onClick={onJoinRequest}>
                Join
              </Button>
              : null
            }
          </>
        }
      </Text>
    }
  </SimpleGrid>;
}

export default function InRoom({
  name
}: {
  name: string
}) {
  const [connData] = useObservableState(store.socketConnData);

  const [opened, { toggle }] = useDisclosure();
  const [leaveDlgOpened, { open: leaveDlgOpen, close: leaveDlgClose }] = useDisclosure(false);
  const [leaving, setLeaving] = useState(false);
  const [awaitingRoomStatus, setAwaitingRoomStatus] = useState(true);
  const [whiteAvailable, setWhiteAvailable] = useState(false);
  const [blackAvailable, setBlackAvailable] = useState(false);
  const [requestingPlay, setRequestingPlay] = useState(false);

  useEffect(() => {
    setAwaitingRoomStatus(true);
    clientSocket.send({
      type: 'request-players-status'
    });
  }, []);

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
        case 'players-status':
          setAwaitingRoomStatus(false);
          setWhiteAvailable(!msg.w);
          setBlackAvailable(!msg.b);
          break;
        case 'players-status-fail':
          store.state.set({id: "Lobby"});
          setAwaitingRoomStatus(false);
          break;
        case 'request-play-fail':
          setRequestingPlay(false);
          notifications.show({
            message: "Couldn't join the game",
            c: 'red'
          });
          break;
        case 'request-play-success':
          store.socketConnData.set({
            connectedToRoom: store.socketConnData.get().connectedToRoom,
            colour: msg.colour
          });
          notifications.show({
            message: 'Playing as ' + msg.colour
          });
          setRequestingPlay(false);
          break;
      }
    }
  });

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
      connData.connectedToRoom === name && !leaving && !awaitingRoomStatus
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
            <Box style={{flexGrow: 1}}><RoleDisplay
              joinable={whiteAvailable || blackAvailable}
              onJoinRequest={() => {
                setRequestingPlay(true);
                clientSocket.send({
                  type: 'request-play',
                  colour: store.preferredColour.get()
                })
              }}
              requestingPlay={requestingPlay}
            /></Box>
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