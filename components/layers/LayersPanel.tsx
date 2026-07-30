'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import { syncLayerData } from '@/actions/layers'

export default function LayersPanel() {
  const role = useGameStore(s => s.role)
  const isDm = role === 'dm'
  const activeMap = useGameStore(s => s.activeMap)
  const mapLayers = useGameStore(s => s.mapLayers)
  const layerRegions = useGameStore(s => s.layerRegions)
  const hexLayerData = useGameStore(s => s.hexLayerData)
  const activeLayerIds = useGameStore(s => s.activeLayerIds)
  const selectedLayerId = useGameStore(s => s.selectedLayerId)
  const selectedRegionId = useGameStore(s => s.selectedRegionId)
  const hasPendingChanges = useGameStore(s => s.hasPendingChanges)
  const toggleLayerId = useGameStore(s => s.toggleLayerId)
  const setSelectedLayerId = useGameStore(s => s.setSelectedLayerId)
  const setSelectedRegionId = useGameStore(s => s.setSelectedRegionId)
  const addLayer = useGameStore(s => s.addLayer)
  const removeLayerFromStore = useGameStore(s => s.removeLayer)
  const addRegion = useGameStore(s => s.addRegion)
  const removeRegionFromStore = useGameStore(s => s.removeRegion)
  const markDirty = useGameStore(s => s.markDirty)
  const markClean = useGameStore(s => s.markClean)

  const [newLayerName, setNewLayerName] = useState('')
  const [newRegionName, setNewRegionName] = useState('')
  const [newRegionColor, setNewRegionColor] = useState('#4488cc')
  const [addingRegionToLayer, setAddingRegionToLayer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleCreateLayer() {
    if (!newLayerName.trim() || !activeMap) return
    const layer = {
      id: crypto.randomUUID(),
      map_id: activeMap.id,
      name: newLayerName.trim(),
      order_index: mapLayers.length,
      created_at: new Date().toISOString(),
    }
    addLayer(layer)
    markDirty()
    setNewLayerName('')
  }

  function handleDeleteLayer(layerId: string) {
    removeLayerFromStore(layerId)
    markDirty()
  }

  function handleCreateRegion(layerId: string) {
    if (!newRegionName.trim()) return
    const region = {
      id: crypto.randomUUID(),
      layer_id: layerId,
      name: newRegionName.trim(),
      color: newRegionColor,
      opacity: 0.4,
      order_index: layerRegions.filter(r => r.layer_id === layerId).length,
    }
    addRegion(region)
    markDirty()
    setNewRegionName('')
    setNewRegionColor('#4488cc')
    setAddingRegionToLayer(null)
  }

  function handleDeleteRegion(regionId: string) {
    removeRegionFromStore(regionId)
    markDirty()
  }

  function handleSelectRegion(layerId: string, regionId: string) {
    if (selectedRegionId === regionId) {
      setSelectedRegionId(null)
      setSelectedLayerId(null)
    } else {
      setSelectedLayerId(layerId)
      setSelectedRegionId(regionId)
    }
  }

  async function handleSave() {
    if (!activeMap) return
    setSaving(true)
    const hexAssignments: { layer_id: string; col: number; row: number; region_id: string }[] = []
    for (const [layerId, innerMap] of hexLayerData) {
      for (const [key, regionId] of innerMap) {
        if (regionId !== null) {
          const [col, row] = key.split(',').map(Number)
          hexAssignments.push({ layer_id: layerId, col, row, region_id: regionId })
        }
      }
    }
    const { error } = await syncLayerData({ mapId: activeMap.id, layers: mapLayers, regions: layerRegions, hexAssignments })
    if (!error) markClean()
    setSaving(false)
  }

  const sorted = [...mapLayers].sort((a, b) => a.order_index - b.order_index)

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 20,
        width: '260px',
        maxHeight: 'calc(100% - 32px)',
        overflowY: 'auto',
        background: 'oklch(0.19 0.014 260)',
        border: '1px solid oklch(1 0 0 / 0.12)',
        borderRadius: '12px',
        boxShadow: '0 12px 32px oklch(0 0 0 / 0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: '1px solid oklch(1 0 0 / 0.08)',
        flex: 'none',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'oklch(0.65 0.02 260)' }}>
          Layers
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedRegionId && (
            <span style={{ fontSize: '10.5px', color: 'oklch(0.78 0.15 85)', fontWeight: 600 }}>
              Painting active
            </span>
          )}
          {isDm && hasPendingChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '3px 10px', border: 'none', borderRadius: '5px',
                background: saving ? 'oklch(0.4 0.01 260)' : 'oklch(0.78 0.15 85 / 0.2)',
                color: saving ? 'oklch(0.5 0.01 260)' : 'oklch(0.78 0.15 85)',
                cursor: saving ? 'default' : 'pointer',
                fontSize: '10.5px', fontWeight: 700,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Layer list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
        {sorted.map(layer => {
          const regions = layerRegions.filter(r => r.layer_id === layer.id).sort((a, b) => a.order_index - b.order_index)
          const isActive = activeLayerIds.has(layer.id)
          return (
            <div key={layer.id} style={{ borderRadius: '8px', border: '1px solid oklch(1 0 0 / 0.08)', overflow: 'hidden' }}>
              {/* Layer header row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 10px',
                background: 'oklch(0.215 0.015 260)',
              }}>
                <button
                  onClick={() => toggleLayerId(layer.id)}
                  title={isActive ? 'Hide layer' : 'Show layer'}
                  style={{
                    width: '18px', height: '18px', border: 'none', borderRadius: '4px',
                    background: isActive ? 'oklch(0.78 0.15 200 / 0.2)' : 'oklch(0.3 0.01 260)',
                    color: isActive ? 'oklch(0.78 0.15 200)' : 'oklch(0.45 0.01 260)',
                    cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  {isActive ? '●' : '○'}
                </button>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'oklch(0.85 0.01 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {layer.name}
                </span>
                {isDm && (
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    style={{ width: '16px', height: '16px', border: 'none', borderRadius: '3px', background: 'transparent', color: 'oklch(0.45 0.01 260)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Region list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 8px' }}>
                {regions.map(region => {
                  const isPainting = selectedRegionId === region.id
                  return (
                    <div
                      key={region.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '4px 6px', borderRadius: '6px',
                        background: isPainting ? 'oklch(0.78 0.15 85 / 0.12)' : 'transparent',
                        border: isPainting ? '1px solid oklch(0.78 0.15 85 / 0.3)' : '1px solid transparent',
                      }}
                    >
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: region.color, flex: 'none', border: '1px solid oklch(0 0 0 / 0.3)' }} />
                      <span style={{ flex: 1, fontSize: '11.5px', color: 'oklch(0.8 0.01 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {region.name}
                      </span>
                      {isDm && (
                        <>
                          <button
                            onClick={() => handleSelectRegion(layer.id, region.id)}
                            title={isPainting ? 'Stop painting' : 'Paint this region'}
                            style={{
                              padding: '2px 6px', border: 'none', borderRadius: '4px',
                              background: isPainting ? 'oklch(0.78 0.15 85 / 0.2)' : 'oklch(0.28 0.01 260)',
                              color: isPainting ? 'oklch(0.78 0.15 85)' : 'oklch(0.55 0.01 260)',
                              cursor: 'pointer', fontSize: '9.5px', fontWeight: 600,
                            }}
                          >
                            {isPainting ? 'Stop' : 'Paint'}
                          </button>
                          <button
                            onClick={() => handleDeleteRegion(region.id)}
                            style={{ width: '14px', height: '14px', border: 'none', borderRadius: '3px', background: 'transparent', color: 'oklch(0.45 0.01 260)', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* Add region form */}
                {isDm && addingRegionToLayer === layer.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                    <input
                      type="color"
                      value={newRegionColor}
                      onChange={e => setNewRegionColor(e.target.value)}
                      style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', padding: 0, cursor: 'pointer', background: 'none' }}
                    />
                    <input
                      autoFocus
                      value={newRegionName}
                      onChange={e => setNewRegionName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateRegion(layer.id); if (e.key === 'Escape') { setAddingRegionToLayer(null); setNewRegionName('') } }}
                      placeholder="Region name"
                      style={{
                        flex: 1, background: 'oklch(0.25 0.015 260)', border: '1px solid oklch(1 0 0 / 0.15)',
                        borderRadius: '5px', color: 'oklch(0.9 0.006 260)', fontSize: '11px', padding: '3px 7px',
                        outline: 'none',
                      }}
                    />
                    <button onClick={() => handleCreateRegion(layer.id)} style={{ padding: '3px 8px', border: 'none', borderRadius: '5px', background: 'oklch(0.78 0.15 85 / 0.15)', color: 'oklch(0.78 0.15 85)', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>+</button>
                  </div>
                ) : isDm ? (
                  <button
                    onClick={() => setAddingRegionToLayer(layer.id)}
                    style={{ alignSelf: 'flex-start', padding: '3px 8px', border: 'none', borderRadius: '5px', background: 'transparent', color: 'oklch(0.5 0.01 260)', cursor: 'pointer', fontSize: '10.5px', marginTop: '2px' }}
                  >
                    + Add region
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}

        {/* Add layer form */}
        {isDm && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <input
              value={newLayerName}
              onChange={e => setNewLayerName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateLayer() }}
              placeholder="New layer name…"
              style={{
                flex: 1, background: 'oklch(0.22 0.015 260)', border: '1px solid oklch(1 0 0 / 0.12)',
                borderRadius: '7px', color: 'oklch(0.9 0.006 260)', fontSize: '11.5px', padding: '6px 10px', outline: 'none',
              }}
            />
            <button
              onClick={handleCreateLayer}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '7px', background: 'oklch(0.78 0.15 85 / 0.15)', color: 'oklch(0.78 0.15 85)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
