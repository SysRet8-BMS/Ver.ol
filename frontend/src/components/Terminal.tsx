import { ReactTerminal, TerminalContextProvider } from "react-terminal";
import { useAuthStore } from "../store/authStore";
import { useTerminalStore } from "../store/terminalStore";

export default function Terminal() {
  const userName = useAuthStore.getState().userName|| useAuthStore.getInitialState().userName;
  const pwd = useTerminalStore((s) => s.getPwd());
  const awaitingDiscardConfirm = useTerminalStore((s) => s.awaitingDiscardConfirm);

  // grab functions/objects with their own selectors so the component only subscribes to what it needs
  const commands = useTerminalStore((s) => s.commands);
  const defaultHandler = useTerminalStore((s) => s.defaultHandler);

  const promptText = awaitingDiscardConfirm ? "" : `${userName}@verol:$${pwd}`;

  return (
    <div>
      <TerminalContextProvider>
        <ReactTerminal
          commands={commands}
          prompt={promptText}
          theme="material-dark"
          defaultHandler={defaultHandler}
        />
      </TerminalContextProvider>
    </div>
  );
}
