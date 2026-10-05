import { AppShell, Burger, Button, Group, Loader, Modal, Title, Text, Stack, Center, Box, SimpleGrid, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useObservableState from '../../hooks/useObservableState';
import store from '../../store';
import clientSocket from '../../sockets/clientSocket';
import { useEffect, useState } from 'react';
import useMessageListener from '../../hooks/useMessageListener';
import { notifications } from '@mantine/notifications';
import MatchHistory from '../match-history/match-history';
import Chessboard from '../chessboard/chessboard';

function RoleDisplay({
  onJoinRequest,
  joinable,
  requestingPlay
}: {
  joinable?: boolean;
  onJoinRequest?: () => void;
  requestingPlay?: boolean;
}) {
  const [connData] = useObservableState(store.socketConnData);

  return <SimpleGrid style={{
    justifyItems: 'center'
  }}>
    {
      requestingPlay
      ? <Loader size='xs' />
      : <Text
        fw={700}
        fs={connData.colour || joinable ? undefined : "italic"}
        c={connData.colour || joinable ? undefined : 'dimmed'}
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
          : joinable
          ? <Button ml='md' onClick={onJoinRequest}>
            Join
          </Button>
          : "Spectator"
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
  const isConnectedToRoom = connData.connectedToRoom === name;

  const [opened, { toggle }] = useDisclosure();
  const [leaveDlgOpened, { open: leaveDlgOpen, close: leaveDlgClose }] = useDisclosure(false);
  const [leaving, setLeaving] = useState(false);
  const [awaitingRoomStatus, setAwaitingRoomStatus] = useState(true);
  const [whiteAvailable, setWhiteAvailable] = useState(false);
  const [blackAvailable, setBlackAvailable] = useState(false);
  const [requestingPlay, setRequestingPlay] = useState(false);

  useEffect(() => {
    if (!isConnectedToRoom) return;
    const reqPlSt = () => {
      // console.log("requesting players status");
      setAwaitingRoomStatus(true);
      clientSocket.send({
        type: 'request-players-status'
      });
    }
    reqPlSt();

    // const handler = (e: KeyboardEvent) => {
    //   if (e.ctrlKey) {
    //     reqPlSt();
    //   }
    // }

    // addEventListener('keydown', handler);

    // return () => removeEventListener('keydown', handler);
  }, [isConnectedToRoom]);

  // Join room if not joined yet
  useEffect(() => {
    if (store.socketConnData.get().connectedToRoom !== name) {
      // console.log('requesting join room');
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
          // console.log("updating players status");
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
            message: msg.reason,
            color: 'red'
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

  // console.log(
  //   "Is in room ", isConnectedToRoom,
  //   "Staying in room ", !leaving,
  //   "room status up to date", !awaitingRoomStatus
  // )

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
      isConnectedToRoom && !leaving && !awaitingRoomStatus
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

        <AppShell.Navbar>
          {/* <ScrollArea>
            <MatchHistory />
          </ScrollArea> */}
          <Button
            variant="outline"
            style={{borderRadius: 0}}
            fullWidth
            onClick={() => store.rulesModal.set(true)}
          >
            Rules
          </Button>
          <Box
            style={{
              overflowY: 'auto'
            }}
          >
            <MatchHistory />
          </Box>
        </AppShell.Navbar>

        <AppShell.Main style={{
          position: 'absolute',
          top:0, left:0, right:0, bottom:0,
          overflow: 'hidden'
        }}>
          <Chessboard />
        </AppShell.Main>
      </AppShell>
      : <Center>
        <Loader />
      </Center>
    }
  </>;
}