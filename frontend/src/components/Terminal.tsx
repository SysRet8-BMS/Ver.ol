import { ReactTerminal, TerminalContextProvider } from "react-terminal";
import {useAuthStore} from '../store/authStore'
import {useTerminalStore} from '../store/terminalStore'

export default function Terminal() {
  return (
    <div>
      <TerminalContextProvider>
        <ReactTerminal
          commands={useTerminalStore.getState().commands}
          prompt={`${useAuthStore.getState().userName}@verol:$${useTerminalStore(state=>state.pwd)}`}
          theme="material-dark"
        />
      </TerminalContextProvider>
    </div>
  );
}
