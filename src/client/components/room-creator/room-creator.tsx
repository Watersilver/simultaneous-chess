import { Button, Center, Checkbox, Fieldset, Group, Loader, Notification, Paper, Radio, Stack, TextInput, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import useObservableState from "../../hooks/useObservableState";
import store from "../../store";
import requestCreateRoom from "../../requests/requestCreateRoom";
import useRequest from "../../hooks/useRequest";
import { CreateRoomSuccessSchema, ReqErrorSchema } from "../../../both/protocol";

export default function RoomCreator({
  onRoomCreateSuccess
}: {
  onRoomCreateSuccess?: (roomName: string) => void
}) {
  const [hidden, setHidden] = useState(false);
  const [player, setPlayer] = useState(true);
  const [preferredColour] = useObservableState(store.preferredColour);
  const [name, setName] = useState('');

  const [res, sendRequest, clear] = useRequest(requestCreateRoom);

  useEffect(() => {
    if (res.status === 'ok' && CreateRoomSuccessSchema.validate(res.data)) {
      if (player) {
        store.autoRequestPlayInRoom.set(name);
      }
      onRoomCreateSuccess?.(name);
      clear();
    }
  }, [res]);

  return <Center>
    <Stack>
      {
        res.status === 'error'
        ? <Notification title="Error" color='red' onClose={clear}>
          {res.error instanceof Error ? res.error.message : 'Something went wrong'}
        </Notification>
        : null
      }
      {
        res.status === 'ok' && ReqErrorSchema.validate(res.data)
        ? <Notification title={res.data.type} color='red' onClose={clear}>
          {
            res.data.type === 'create room'
            ? res.data.message
            : res.data.type === 'malformed json'
            ? res.data.issues.map(i => "on path `" + i.path + "`: " + i.message).join('\n')
            : 'Something went wrong'
          }
        </Notification>
        : null
      }
      {
        res.status === 'loading'
        ? <Loader />
        : <>
          <Button
            style={{
              position: 'absolute',
              left: 8,
              top: 8
            }}
            onClick={() => {
              store.state.set({id: "Lobby"});
            }}
          >
            Back to lobby
          </Button>
          <Fieldset
            legend="New room"
          >
            <Stack>
              <Tooltip
                label="This will be the room id. People can enter this room if they enter its name in the lobby search input or by clicking on it if the room is public and listed."
              >
                <TextInput
                  label="Room name"
                  placeholder="Super chess match"
                  required
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </Tooltip>
              <Tooltip
                label="Whether you will enter the room as a player."
              >
                <Checkbox
                  checked={player}
                  onChange={(event) => setPlayer(event.currentTarget.checked)}
                  label="player"
                />
              </Tooltip>
              {
                player
                ? <Radio.Group
                  value={preferredColour}
                  onChange={e => store.preferredColour.set(e)}
                  label="Which do you prefer?"
                  // description="Purely aesthetic as white doesn't play first"
                >
                  <Group mt="xs">
                    <Radio value="white" label="White" />
                    <Radio value="black" label="Black" />
                  </Group>
                </Radio.Group>
                : null
              }
              <Tooltip
                label="Public rooms will appear in the room list. Non public rooms can still be entered by people who know their name."
              >
                <Checkbox
                  checked={!hidden}
                  onChange={(event) => setHidden(!event.currentTarget.checked)}
                  label="public"
                />
              </Tooltip>
            </Stack>

            <Group justify="flex-end" mt="md">
              <Button
                disabled={name === ""}
                onClick={() => {
                  sendRequest(name, hidden);
                }}
              >
                Submit
              </Button>
            </Group>
          </Fieldset>
        </>
      }
    </Stack>
  </Center>
}