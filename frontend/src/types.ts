interface node{
    _id: string;
    repoId: string;
    commitId: string;
    parentNodeId: string|null;
    name: string;
    type: 'file' | 'folder';
    gridFSFileId: string|null;
    timestamp: Date;
}
export type Change =
  | {
      type: "rename";
      nodeId: string;
      payload: { newName: string };
    }
  | {
      type: "move";
      nodeId: string;
      payload: { newParentId: string };
    }
  | {
      type: "delete";
      nodeId: string;
      payload?: undefined;
    };
export type UINode = node & { isExpanded?: boolean; children?: UINode[] };

