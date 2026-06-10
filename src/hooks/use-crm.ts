"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import type {
  CrmEntity,
  CrmListResponse,
  CrmObjectType,
  EntityWriteBody,
  ObjectDefinitions,
} from "@/lib/lightfield/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export interface UseEntityListOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
  enabled?: boolean;
}

export function useEntityList(type: CrmObjectType, options: UseEntityListOptions = {}) {
  const { limit = 25, offset = 0, filters = {}, enabled = true } = options;
  const search = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "") search.set(key, value);
  }
  const queryString = search.toString();

  return useQuery({
    queryKey: ["crm", type, "list", queryString],
    queryFn: () => fetchJson<CrmListResponse>(`/api/crm/${type}?${queryString}`),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useEntity(type: CrmObjectType, id: string | undefined) {
  return useQuery({
    queryKey: ["crm", type, "detail", id],
    queryFn: () => fetchJson<CrmEntity>(`/api/crm/${type}/${id}`),
    enabled: Boolean(id),
  });
}

export function useDefinitions(type: CrmObjectType) {
  return useQuery({
    queryKey: ["crm", type, "definitions"],
    queryFn: () => fetchJson<ObjectDefinitions>(`/api/crm/${type}/definitions`),
    staleTime: 5 * 60_000,
  });
}

export function useCreateEntity(type: CrmObjectType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EntityWriteBody) =>
      fetchJson<CrmEntity>(`/api/crm/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", type] });
    },
  });
}

export function useUpdateEntity(type: CrmObjectType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EntityWriteBody }) =>
      fetchJson<CrmEntity>(`/api/crm/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", type] });
    },
  });
}

export function useListMembers(
  listId: string | undefined,
  objectType: "account" | "contact" | "opportunity",
  options: { limit?: number; offset?: number } = {},
) {
  const { limit = 25, offset = 0 } = options;
  return useQuery({
    queryKey: ["crm", "list-members", listId, objectType, limit, offset],
    queryFn: () =>
      fetchJson<CrmListResponse>(
        `/api/crm/list/${listId}/members?objectType=${objectType}&limit=${limit}&offset=${offset}`,
      ),
    enabled: Boolean(listId),
    placeholderData: keepPreviousData,
  });
}
