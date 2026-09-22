import ObservableState from "./utils/ObservableState";

type ProgramState = {
  id: "Loading"
} | {
  id: "CreatingRoom"
} | {
  id: "InRoom"
}

const store = {
  state: new ObservableState<ProgramState>({id: "Loading"})
}

export default store;