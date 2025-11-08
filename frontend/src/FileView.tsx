import { useLoaderData } from "react-router";
import {useTerminalStore} from './store/terminalStore'
import Editor from "@monaco-editor/react";

const langMap: Record<string, string> = {
  js: "javascript",
  jsx:"javascript",
  ts: "typescript",
  tsx:"typescript",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  txt: "plaintext",
};

export default function FileView() {
  const { fileContent, fileName, contentType } = useLoaderData() as {
    fileContent: string;
    fileName: string;
    contentType: string;
  };
  const pwd = useTerminalStore.getState().getPwd();

  const filePath = `${pwd}/${fileName}`
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const language = langMap[ext] || "plaintext";

  // Image handling
  if (contentType.startsWith("image/")) {
    return (
      <>
        <div className="font-bold text-3xl">{filePath}</div>
        <img src={fileContent} alt={filePath} className="max-w-full h-auto" />
      </>
    );
  }

  // PDF handling
  if (contentType === "application/pdf") {
    return (
      <>
        <div className="font-bold text-3xl">{filePath}</div>
        <iframe
          src={fileContent}
          width="100%"
          height="800px"
          title={filePath}
        />
      </>
    );
  }

  // Code or text-like content
  const isTextLike =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    langMap[ext];

  if (isTextLike) {
    return (
      <>
        <div className="font-bold text-3xl">{filePath}</div>
        <Editor
          value={fileContent}
          language={language}
          theme="vs-dark"
          options={{ readOnly: true }}
          height="80vh"
        />
      </>
    );
  }

  // Fallback for unsupported files
  return (
    <div>
      <div className="font-bold text-3xl">{filePath}</div>
      Unsupported format D:
    </div>
  );
}
