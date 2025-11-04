import Folder from "./Folder";
import File from "./File";
import type {UINode} from '../types'

export default function FileTree(props:{nodes:UINode[]}) {

    const nodes = props.nodes;

    return (
        <div className="font-mono text-sm">
            {nodes.map((node) =>
            
                node.type === "folder" &&node.parentNodeId!==null ? (
                <Folder key={node._id} nodeId={node._id} level={0} />
                ) : node.parentNodeId!==null?(
                <File key={node._id} node={node} level={0} />
                ):<div key={node._id}></div>
            )}
        </div>
  );
}
