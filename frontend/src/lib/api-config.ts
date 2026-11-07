/**
 * Centralized API configuration connecting Frontend (Vercel) to Backend (Render)
 *
 * To connect your deployed Render backend:
 * Option 1: In Vercel Project Settings -> Environment Variables, add:
 *           NEXT_PUBLIC_GRAPH_SERVICE_URL = https://your-backend.onrender.com
 * Option 2: Or simply replace the fallback URL below with your Render URL.
 */

export const BACKEND_URL =
  (process.env.NEXT_PUBLIC_GRAPH_SERVICE_URL || process.env.NEXT_PUBLIC_BACKEND_URL)?.replace(/\/$/, "") ||
  "https://macaroon-graph-service.onrender.com";

export const API_ENDPOINTS = {
  health: `${BACKEND_URL}/health`,
  rebuild: `${BACKEND_URL}/rebuild`,
  graph: (protocolId: string = "aave-v3-mainnet") => `${BACKEND_URL}/graph/${protocolId}`,
  protocols: `${BACKEND_URL}/protocols`,
  swarm: (ref: string) => `${BACKEND_URL}/swarm/${ref}`,
  creStatus: `${BACKEND_URL}/api/cre/status`,
  creReset: `${BACKEND_URL}/api/cre/reset`,
  creMutate: `${BACKEND_URL}/api/cre/mutate`,
};