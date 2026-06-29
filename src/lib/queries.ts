import {
  useQuery, useMutation, useQueryClient, useQueries,
} from '@tanstack/react-query'
import { api } from '../api/client'
import type { AssetRecord, DropdownRow } from '../api/types'
import { ASSET_TYPES, type AssetType } from '../config/assets'

export function useAssets(type: AssetType) {
  return useQuery({
    queryKey: ['assets', type.key],
    queryFn: () => api.list<AssetRecord>(type.endpoint),
  })
}

// Counts for every asset type at once (dashboard).
export function useAllCounts() {
  return useQueries({
    queries: ASSET_TYPES.map((t) => ({
      queryKey: ['assets', t.key],
      queryFn: () => api.list<AssetRecord>(t.endpoint),
      staleTime: 30_000,
    })),
    combine: (results) =>
      ASSET_TYPES.map((t, i) => ({
        type: t,
        count: results[i].data?.length ?? 0,
        rows: results[i].data ?? [],
        loading: results[i].isLoading,
      })),
  })
}

export function useAsset(type: AssetType, id: number) {
  return useQuery({
    queryKey: ['asset', type.key, id],
    queryFn: () => api.get<AssetRecord>(type.endpoint, id),
    enabled: Number.isFinite(id),
  })
}

export function useSubResource(endpoint: string, id: number, sub: string, enabled = true) {
  return useQuery({
    queryKey: ['sub', endpoint, id, sub],
    queryFn: () => api.list<Record<string, unknown>>(`${endpoint}/${id}/${sub}`),
    enabled: enabled && Number.isFinite(id),
    retry: false,
  })
}

// Dropdown options, cached aggressively (they rarely change).
export function useDropdown(endpoint?: string) {
  return useQuery({
    queryKey: ['dropdown', endpoint],
    queryFn: () => api.list<DropdownRow>(endpoint as string),
    enabled: !!endpoint,
    staleTime: 5 * 60_000,
  })
}

export function useCreateAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.create<AssetRecord>(type.endpoint, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', type.key] }),
  })
}

export function useUpdateAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api.update<AssetRecord>(type.endpoint, id, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['assets', type.key] })
      qc.invalidateQueries({ queryKey: ['asset', type.key, vars.id] })
    },
  })
}

export function useDeleteAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.remove(type.endpoint, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', type.key] }),
  })
}
