import { Table, TableData, Text, Timeline } from "@mantine/core";
import useObservableState from "../../hooks/useObservableState.js";
import store from "../../store.js";

store.history.set([
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'a1', t: 'a2'}, b: {f: 'a2', t: 'b4'}},
  {w: {f: 'h1', t: 'h7'}, b: {f: 'g2', t: 'd4'}}
]);

export default function MatchHistory() {
  const [history] = useObservableState(store.history);

  const data: TableData = {
    head: ['White', 'Black'],
    body: history.map(t => {
      return [
        t.w.f + "->" + t.w.t,
        t.b.f + "->" + t.b.t
      ]
    })
  };

  return <Table striped highlightOnHover withColumnBorders withRowBorders={false} data={data} />
}