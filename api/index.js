import { handleApiRequest } from "../server/apiHandler.js";

export default async function handler(req, res) {
  return handleApiRequest(req, res);
}
