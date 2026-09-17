import { useState } from "react";

import reactLogo from "./assets/react.svg";
import MatchSelection from "./components/match-selection/match-selection";
import { Container, createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({})

function App() {
  const [currentRoom, setCurrentRoom] = useState('');

  return (
    <MantineProvider theme={theme} defaultColorScheme='dark'>
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
        <MatchSelection/>
      </Container>
    </MantineProvider>
  );
}

export default App;
