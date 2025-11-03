import { ReactTerminal, TerminalContextProvider } from "react-terminal";

export default function Terminal() {
  const commands = {
    help: () => "Available commands: help, echo, greet",
    echo: (text: string) => text,
    greet: (name: string) => `Hello, ${name || "stranger"}!`,
  };
  return (
    <div>
      <TerminalContextProvider>
        <ReactTerminal
          commands={commands}
          
          theme="material-dark"
        />
      </TerminalContextProvider>
    </div>
  );
}
