import { Turn } from "../both/Notation";
import ObservableState from "./utils/ObservableState";

type ProgramState = {
  id: "Loading"
} | {
  id: "Lobby",
} | {
  id: "CreatingRoom"
} | {
  id: "InRoom",
  name: string
}

const store = {
  state: new ObservableState<ProgramState>({id: "Loading"}),
  preferredColour: new ObservableState<'white' | 'black'>('white', {
    storage: {
      serialise: c => c,
      deserialise: c => c === 'white' ? 'white' : 'black',
      id: 'preferredColour'
    },
  }),
  roomCreationError: new ObservableState(""),
  roomJoinError: new ObservableState(""),
  reqestPlayError: new ObservableState(""),
  autoRequestPlayInRoom: new ObservableState(''),
  socketConnData: new ObservableState({
    connectedToRoom: '',
    colour: null as 'white' | 'black' | null
  }),
  history: new ObservableState<(Turn & {description?: string})[]>([])
}

export default store;