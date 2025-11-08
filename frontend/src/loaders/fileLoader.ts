import {authFetch} from '../utils/authFetch'
import type {LoaderFunctionArgs} from 'react-router'
const BASE_URL = import.meta.env.VITE_BASE_URL;


export async function fileContentLoader({ params }: LoaderFunctionArgs) {
  const { fileId, fileName } = params;

  if (!fileId) throw Error("fileId not found");

  try {
    const res = await authFetch(`${BASE_URL}/app/repo/api/getFile/${fileId}`);
    if (!res.ok) throw new Error(`Error with status code: ${res.status}`);

    const contentType = res.headers.get("Content-Type") || "";

    // If it's text or JSON, stream-decode
    if (contentType.startsWith("text/") || contentType.includes("json")) {
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fileContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fileContent += decoder.decode(value, { stream: true });
      }

      return { fileContent, fileName,contentType };
    }

    // Otherwise, it's binary: get it as Blob
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    return { fileContent: blobUrl, fileName, contentType };
  } catch (error) {
    console.error("Error occurred in the file loader!", error);
    throw error;
  }
}
