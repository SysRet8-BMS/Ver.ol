import { useState } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon } from "lucide-react";
import { useRepoStore } from "../store/repoStore";
import File from "./File";
import { appendChildrenNodes, findNodeHelper } from "../utils/helper";

export default function Folder({ nodeId, level }: { nodeId: string; level: number }) {
  const [loading, setLoading] = useState(false);
  
  // Subscribe to both mode and the nodes
  const mode = useRepoStore((s) => s.mode);
  const toggleExpand = useRepoStore((s) => s.toggleExpand);
  
  // Find node from subscribed data
  const node = useRepoStore((s) => {
    let source;
    if(s.isViewingCommit === true) source = s.commitNodes;
    else if (s.mode === "staging") source = s.stagedNodes;
    else source = s.nodes;

    return findNodeHelper(source, nodeId);
  });

  // Add logging
  console.log(`Folder ${nodeId} rendering, mode: ${mode}, node:`, node?.name, 'children:', node?.children?.map(c => c.name));
    
  if (!node) return null;

  const handleClick = async () => {
    if (!node.isExpanded && (!node.children || node.children.length === 0)) {
      setLoading(true);
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