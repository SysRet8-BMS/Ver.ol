import {useLoaderData } from "react-router";
import FileTree from './components/FileTree'
import {useRepoStore} from './store/repoStore'

import Terminal from './components/Terminal'

export default function RepoView() {
  const repoNodes = useLoaderData();
  console.log(repoNodes)

  return (
    <div className="p-4">
      <div className="max-h-72 overflow-y-auto rounded-lg">
        <Terminal/>
      </div>

      <div className="mt-4 pt-4">
        <div className="text-4xl mb-4 font-bold">{useRepoStore.getState().repoName}</div>
        <FileTree nodes={repoNodes}/>
      </div>

    </div>
  )

}
