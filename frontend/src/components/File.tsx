import { FileText } from "lucide-react";
import {Link} from 'react-router';

import type {UINode} from '../types'
export default function File({ node, level }:{node:UINode,level:number}) {
  return (
    <Link to={`/app/fileview/${node._id}/${node.name}`}
      className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1"
      style={{ paddingLeft: level * 12 }}
      id={node._id}
    >
      <FileText size={14} className="text-blue-600" />
      <span>{node.name}</span>
    </Link>
  );
}
