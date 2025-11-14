import { useMemo } from "react";
import { useLoaderData, Link, Form } from "react-router";
import FileTree from "./components/FileTree";
import Terminal from "./components/Terminal";
import { useRepoStore } from "./store/repoStore";
import {Button} from './components/ui/button'
const symbolMap = {
  move: ">",
  rename: "→",
  delete: "-",
  edit: "✎",
};

const colorMap = {
  move: "text-blue-700",
  rename: "text-orange-400",
  delete: "text-red-700",
  edit: "text-green-600",
};

export default function RepoView() {
  const repoNodes = useLoaderData(); // keep typing minimal for now

  // subscribe once with a stable selector object (primitive values and arrays)
  const mode = useRepoStore((s) => s.mode);
  const nodes = useRepoStore((s) => s.nodes);
  const stagedNodes = useRepoStore((s) => s.stagedNodes);
  const repoName = useRepoStore((s) => s.repoName);
  const repoId = useRepoStore((s)=>s.repoId);
  const stagedChanges = useRepoStore((s)=>s.stagedChanges)
  const visibleNodes = useMemo(() => (mode === "staging" ? stagedNodes : nodes), [
    mode,
    nodes,
    stagedNodes,
  ]);

  // Helper function to find node by ID
  const findNodeById = (nodeId: string, nodesToSearch: typeof nodes): typeof nodes[0] | null => {
    for (const node of nodesToSearch) {
      if (node._id === nodeId) return node;
      if (node.children) {
        const found = findNodeById(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  if (!visibleNodes) return null;

  console.log("RepoView rendering:", visibleNodes.length);

  return (
    <div className="p-4">
      <div className="max-h-72 overflow-y-auto rounded-lg">
        <Terminal />
      </div>

    <div className="mb-4">
          {mode === "viewing" ? (
            <div className="font-bold text-xl">Mode: {mode}</div>
          ) : (
            <div>
              <div className="font-bold text-xl">Mode: {mode}</div>
              <div>Staged Changes</div>
              <ul className="list-none pl-6">
                {stagedChanges.map((change, idx) => (
                  <li key={idx}>
                    {change.type === "rename" &&

                      <span className={colorMap[change.type]}>
                        {`${symbolMap[change.type]} Renamed  ${change.payload.oldName} to ${change.payload.newName}`}
                      </span>
                    }       
                    {change.type === "move" &&
                      <span className={colorMap[change.type]}>
                        {`${symbolMap[change.type]} Moved ${change.payload.src} to ${change.payload.dest}`}
                      </span>
                    }

                    {change.type === "delete" &&
                    <span className={colorMap[change.type]}>
                      {`${symbolMap[change.type]} Deleted ${change.payload.deletedNodeName}`}
                    </span>
                    }

                    {change.type === "edit" &&
                    <span className={colorMap[change.type]}>
                      {(() => {
                        const editedNode = findNodeById(change.nodeId, visibleNodes);
                        const fileName = editedNode?.name || `nodeId: ${change.nodeId}`;
                        return `${symbolMap[change.type]} Edited ${fileName}`;
                      })()}
                    </span>
                    }
                  </li>
                ))}
              </ul>
            </div>

          )}
        </div>

      <Button className="font-thin border-2"><Link to={`/app/commitsview/${repoId}`} >View Commits</Link></Button>
      <Form method="post" action={`/app/delete/${repoId}`}>
        <Button type="submit" className="font-thin border-2 bg-red">DELETE</Button>
      </Form>
      <div className="mt-4 pt-4">
        <div className="text-4xl mb-4 font-bold">{repoName}</div>

        {/* fallback to loader nodes only if visibleNodes is empty */}
        <FileTree nodes={visibleNodes.length > 0 ? visibleNodes : repoNodes} />
      </div>
    </div>
  );
}
