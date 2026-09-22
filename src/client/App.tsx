import MatchSelection from "./components/match-selection/match-selection";
import { Container, createTheme, Loader, MantineProvider } from "@mantine/core";
import useObservableState from "./hooks/useObservableState";
import store from "./store";

const theme = createTheme({});

function App() {
  const [state] = useObservableState(store.state);

  return <MantineProvider theme={theme} defaultColorScheme='dark'>
    {state.id === "Loading"
    ? <Loader />
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
      <MatchSelection/>
    </Container>}
  </MantineProvider>;
}

export default App;
