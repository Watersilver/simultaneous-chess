import { Box, Image } from "@mantine/core";
import { Position } from "../../../both/Notation";
import board from "../../assets/chess/Board.png";

export default function Chessboard({
  data
}: {
  data: Position
}) {

  return <Box
    style={{
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      userSelect: 'none'
    }}
  >
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        alignItems: 'center',
        justifyItems: 'center'
      }}
    >
      <Box
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: 1,
          outline: 'dashed red'
        }}
      >
      </Box>
    </Box>
    <Image
      fit="contain"
      style={{
        imageRendering: 'pixelated',
        height: '100%',
        pointerEvents: 'none'
      }}
      src={board}
    />
  </Box>;
}