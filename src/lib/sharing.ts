import pako from 'pako';
import { ProjectState, SharedProjectState } from '@/types';
import { nanoid } from 'nanoid';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export function compressAndEncode(project: SharedProjectState): string {
  const jsonString = JSON.stringify(project);
  const compressed = pako.gzip(jsonString);
  return uint8ArrayToBase64(compressed);
}

export function decodeAndDecompress(encodedData: string): SharedProjectState | null {
  try {
    const compressed = base64ToUint8Array(encodedData);
    const jsonString = pako.inflate(compressed, { to: 'string' });
    const project = JSON.parse(jsonString);
    // Basic validation
    if (project && typeof project.code === 'string' && typeof project.language === 'string') {
      return project;
    }
    return null;
  } catch (error) {
    console.error("Failed to decode or decompress project data:", error);
    return null;
  }
}

export function generateUrlHash(encodedData: string): string {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return `${baseUrl}#h:${encodedData}`;
}

// Optional Supabase integration: save a shared project to `shared_projects` table.
// Expects a table with columns: id (uuid, pk), project_id (text, unique, short), payload (text), created_at (timestamp)
export async function saveSharedProjectToSupabase(supabaseClient: any, project: SharedProjectState, projectId?: string) {
  try {
    const encoded = compressAndEncode(project);
    const payload = encoded;
    const id = projectId || nanoid(8);
    const insert = { project_id: id, payload };
    // Use upsert so that if a client supplies a project_id it won't fail on conflict
    const { data, error } = await supabaseClient.from('shared_projects').upsert(insert, { onConflict: 'project_id' }).select('project_id,id,payload').single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to save project to supabase', err);
    throw err;
  }
}

export function generateProjectId(len = 8) {
  return nanoid(len);
}