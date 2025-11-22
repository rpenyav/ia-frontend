// src/infrastructure/api/api.ts

import { getApiBaseUrl, getAuthToken } from "../config/env";

export class ApiError extends Error {
  status: number;
  url: string;
  body?: unknown;

  constructor(status: number, url: string, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export interface FetchWithAuthOptions extends RequestInit {
  /**
   * Si es true, devolvemos el Response crudo (streaming, blobs, etc.)
   * sin intentar parsear JSON.
   */
  rawResponse?: boolean;
}

export async function fetchWithAuth<T = unknown>(
  path: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const token = getAuthToken();

  const {
    headers: customHeaders,
    rawResponse = false,
    ...restOptions
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      credentials: "include",
    });
  } catch (err) {
    // Error de red / CORS / servidor caído
    throw new ApiError(0, url, "Error de red al conectar con el servidor.");
  }

  // 🟢 CASO STREAMING / RAW → NO TOCAMOS EL BODY
  if (rawResponse) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`
      );
    }
    return response as unknown as T;
  }

  // 🟢 204 No Content (por ejemplo DELETE)
  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`
      );
    }
    return null as T;
  }

  let text: string;
  try {
    text = await response.text();
  } catch (err) {
    throw new ApiError(
      response.status,
      url,
      `Error leyendo la respuesta de ${url}.`
    );
  }

  let json: unknown = null;

  if (text && text.length > 0) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      // Aquí es donde te estaba saltando el
      // "Error parseando JSON de la respuesta de /chat/message"
      throw new ApiError(
        response.status,
        url,
        `Error parseando JSON de la respuesta de ${url}.`,
        text
      );
    }
  }

  if (!response.ok) {
    const messageFromBody =
      (json as any)?.message ||
      (json as any)?.error ||
      `Error HTTP ${response.status} al llamar a ${url}`;

    throw new ApiError(response.status, url, messageFromBody, json);
  }

  return json as T;
}
