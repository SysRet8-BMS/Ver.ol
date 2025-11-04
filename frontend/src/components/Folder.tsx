import { useState } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon } from "lucide-react";
import { useRepoStore } from "../store/repoStore";
import File from "./File";
import { appendChildrenNodes } from "../utils/helper";

import type { UINode } from "../types";

function findNode(nodes: UINode[] = [], id: string): UINode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function Folder({ nodeId, level }: { nodeId: string; level: number }) {
  const [loading, setLoading] = useState(false);

  // Selector #1: read the node instance by traversing the tree (pure)
  const node = useRepoStore((s) => findNode(s.nodes, nodeId));

  // Selector #2: read the toggleExpand function (stable function reference)
  const toggleExpand = useRepoStore((s) => s.toggleExpand);

  if (!node) return null;

  const handleClick = async () => {
    // avoid state changes during render — this is an event handler so it's safe
    if (!node.isExpanded && (!node.children || node.children.length === 0)) {
      setLoading(true);
      // make appendChildrenNodes an async function that updates the store.
      await appendChildrenNodes(node);
      setLoading(false);
    }
    toggleExpand(node._id);
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1"
        style={{ paddingLeft: level * 12 }}
        onClick={handleClick}
        id={node._id}
      >
        {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <FolderIcon size={14} className="text-yellow-600" />
        <span>{node.name}</span>
      </div>

      {loading && <div style={{ paddingLeft: (level + 1) * 12 }}>Loading...</div>}

      {node.isExpanded &&
        node.children?.map((child) =>
          child.type === "folder" ? (
            <Folder key={child._id} nodeId={child._id} level={level + 1} />
          ) : (
            <File key={child._id} node={child} level={level + 1} />
          )
        )}
    </div>
  );
}
