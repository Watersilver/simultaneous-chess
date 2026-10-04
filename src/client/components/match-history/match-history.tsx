import { Table, Text } from "@mantine/core";
import useObservableState from "../../hooks/useObservableState.js";
import store from "../../store.js";
import { PieceType, Turn } from "../../../both/Notation.js";

const pieceTypeMap: {[type in PieceType]: string} = {
  '': "pawn",
  'B': "bishop",
  'N': "knight",
  'R': "rook",
  'Q': "queen",
  'K': "king"
};

function TurnDatum({t, col}: {t: Turn, col: 'w' | 'b'}) {
  const captures = col === 'w' ? t.bCaptures : t.wCaptures;
  const enPassant = col === 'w' ? t.wEnPassant : t.bEnPassant;
  const castling = col === 'w' ? t.wCastling : t.bCastling;
  const check = col === 'w' ? t.wCheck : t.bCheck;
  const victor = t.victor === 'black' ? 'b' : t.victor === "white" ? 'w' : null;
  return <>
    {
      castling
      ? <Text>{t[col].t[0] === "h" ? "kingside" : "queenside"} castling</Text>
      : <Text>{t[col].f + "->" + t[col].t}</Text>
    }
    {enPassant ? <Text>en passant!</Text> : null}
    {captures?.length ? captures.map((c, i) => <Text key = {i}>{t.collided ? "collided with" : "captured"} {pieceTypeMap[c]}</Text>) : null}
    {check ? <Text>in check</Text> : null}
    {!t.end ? null : victor === col ? "winner!" : victor ? "loser" : 'draw'}
  </>;
}

export default function MatchHistory() {
  const [history] = useObservableState(store.history);

  // return <Table striped highlightOnHover withColumnBorders withRowBorders={false} data={data} />;
  return <Table striped highlightOnHover withColumnBorders withRowBorders={false}>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>#</Table.Th>
        <Table.Th>White</Table.Th>
        <Table.Th>Black</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {
        history.map(t => {
          return <Table.Tr key={t.id}>
            <Table.Th>{t.id}</Table.Th>
            <Table.Td><TurnDatum col="w" t={t} /></Table.Td>
            <Table.Td><TurnDatum col="b" t={t} /></Table.Td>
          </Table.Tr>;
        })
      }
    </Table.Tbody>
  </Table>;
}