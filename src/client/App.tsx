import MatchSelection from "./components/match-selection/match-selection";
import { Button, Center, Container, createTheme, Loader, MantineProvider } from "@mantine/core";
import useObservableState from "./hooks/useObservableState";
import store from "./store";
import RoomCreator from "./components/room-creator/room-creator";
import InRoom from "./components/in-room/in-room";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({});

function App() {
  const [state] = useObservableState(store.state);

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
            ? <RoomCreator onRoomCreateSuccess={(roomName: string) => store.state.set({id: 'InRoom', name: roomName})} />
            : <div>Why?? How!?</div>
          }
        </Container>
    }
  </MantineProvider>;
}

export default App;
