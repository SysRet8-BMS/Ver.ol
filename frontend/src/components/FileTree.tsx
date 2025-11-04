import Folder from "./Folder";
import File from "./File";
import type { UINode } from "../types";

export default function FileTree({ nodes }: { nodes: UINode[] }) {
  if (!nodes || nodes.length === 0) return <div>No files</div>;

  return (
    <div className="font-mono text-sm">
      {nodes.map((node) => {
        if (node.parentNodeId === null) return null;

        if (node.type === "folder") {
          return <Folder key={node._id} nodeId={node._id} level={0} />;
        } else {
          return <File key={node._id} node={node} level={0} />;
        }
      })}
    </div>
  );
}
