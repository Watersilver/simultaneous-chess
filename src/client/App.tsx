import MatchSelection from "./components/match-selection/match-selection";
import { Center, Container, createTheme, Loader, MantineProvider } from "@mantine/core";
import useObservableState from "./hooks/useObservableState";
import store from "./store";

const theme = createTheme({});

function App() {
  const [state] = useObservableState(store.state);

  return <MantineProvider theme={theme} defaultColorScheme='dark'>
    <Container
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
        : <MatchSelection/>
      }
    </Container>
  </MantineProvider>;
}

export default App;
