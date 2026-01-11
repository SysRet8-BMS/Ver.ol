import { useLoaderData ,Link} from "react-router";
import { useRepoStore } from "./store/repoStore";
import type { Commit } from "./types";

export default function CommitsView() {
  const { commits } = useLoaderData() as { commits: Commit[] };
  
  // Sort commits by date (descending)
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Group commits by date (YYYY-MM-DD)
  const groupedCommits = sortedCommits.reduce((groups, commit) => {
    const dateKey = new Date(commit.timestamp).toLocaleDateString("en-CA"); // ISO-style (YYYY-MM-DD)
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(commit);
    return groups;
  }, {} as Record<string, Commit[]>);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Commit History of {useRepoStore.getState().repoName}</h1>
      <div className="space-y-8">
        {Object.entries(groupedCommits).map(([date, commitsForDate]) => (

          <div key={date}>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <div className="space-y-3 border-l-2 border-gray-300 pl-4">
              {commitsForDate.map((commit) => (
                <Link key={commit._id} to={`/app/commit/${commit.repoId}/${commit._id}`}>
                    <div
                    key={commit._id}
                    className="flex flex-col bg-gray-50 hover:bg-gray-100 transition p-3 rounded-lg shadow-sm"
                    >
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                        {commit.author?.username ?? "Unknown Author"}
                        </span>
                        <span className="text-xs text-gray-500">
                        {new Date(commit.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">
                        {commit.message || "(No message)"}
                    </p>
                    </div>
                </Link>

              ))}
            </div>
          </div>


        ))}
      </div>
    </div>
  );
}
