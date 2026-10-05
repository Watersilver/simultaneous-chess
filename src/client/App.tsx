import MatchSelection from "./components/match-selection/match-selection";
import { Button, Center, Container, createTheme, List, Loader, MantineProvider, Modal, Text, Title } from "@mantine/core";
import useObservableState from "./hooks/useObservableState";
import store from "./store";
import RoomCreator from "./components/room-creator/room-creator";
import InRoom from "./components/in-room/in-room";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({});

function App() {
  const [state] = useObservableState(store.state);
  const [rulesModal] = useObservableState(store.rulesModal);

  return <MantineProvider theme={theme} defaultColorScheme='dark'>
    <Notifications />
    {
      state.id === "InRoom"
      ? <InRoom name={state.name} />
      : <Container
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
        strategy="grid"
      >
        {
          state.id === "Loading"
          ? <Center>
            <Loader />
          </Center>
          : state.id === "Lobby"
          ? <>
            <Button
              style={{position: 'absolute', right: 8, top: 8}}
              onClick={() => store.state.set({id: 'CreatingRoom'})}
            >New room</Button>
            <MatchSelection/>
          </>
          : state.id === "CreatingRoom"
          ? <RoomCreator onRoomCreateSuccess={(roomName: string) => {
            // console.log('setting state to InRoom');
            store.state.set({id: 'InRoom', name: roomName});
          }} />
          : <div>Why?? How!?</div>
        }
      </Container>
    }
    {
      state.id === 'Lobby' ? <Button
        style={{
          position: 'absolute',
          top: 8, left: 8
        }}
        onClick={() => store.rulesModal.set(true)}
        variant="outline"
      >
        Rules
      </Button>
      : null
    }
    <Modal opened={rulesModal} onClose={() => store.rulesModal.set(false)} title="Rules">
      <Text>
        Simultaneous chess is a variant of chess where both players commit their moves before the turn and then these moves get resolved simultaneously within the turn.
      </Text>
      <br />
      <Text>
        There are many different internally consistent ways the moves can be resolved. In this case the resolution happens as follows:
      </Text>
      <br />
      <List>
        <List.Item>
          <Text fw={700}>No running away:</Text> A piece that would be captured by the move of the enemy cannot escape by moving to another spot. It can be moved and be used to capture another piece, including its capturer but by the end of the turn it's captured.
        </List.Item>
        <List.Item>
          <Text fw={700}>Collisions:</Text> If two pieces end up on the same spot, or one finishes its move on a path the other crossed, they collide and both get captured before finishing their moves. A collision is the only way to save a piece that is about to be captured.
        </List.Item>
        <List.Item>
          <Text fw={700}>Fast king:</Text> The king is the only piece that can escape capture by moving out of the way or by having its would be capturer captured before their move is done. This rule isn't strictly necessary but if it's not here most checks become checkmates except when there is a piece available to interpose between them to force a collision.
        </List.Item>
      </List>
    </Modal>
  </MantineProvider>;
}

export default App;
