import { useMemo, useState } from 'react'
import CameraControls from './CameraControls'
import LoadMesh from './LoadMesh'
import HighlightLayer from './HighlightLayer'

const mockLoads = Array.from({ length: 9 }).map((_, i) => ({ id: `LD-${1000 + i}`, weight: 2200 + i * 70, volume: 8 + i, pos: [i % 3, Math.floor(i / 3), 0] }))

export default function RailcarScene({ showViolations, compareMode }) {
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const invalidIds = useMemo(() => (showViolations ? new Set(['LD-1002', 'LD-1007']) : new Set()), [showViolations])

  return (
    <div className={`railcar-scene ${compareMode ? 'compare' : ''}`}>
      <CameraControls />
      <div className="container-frame">
        {mockLoads.map((load) => (
          <div key={load.id} onMouseEnter={() => setHovered(load.id)} onMouseLeave={() => setHovered(null)} onClick={() => setSelected(load.id)}>
            <LoadMesh load={load} hovered={hovered === load.id} selected={selected === load.id} invalid={invalidIds.has(load.id)} />
            {hovered === load.id && <div className="tooltip">{load.id} • {load.weight}kg • {load.volume}m³ • ({load.pos.join(',')})</div>}
          </div>
        ))}
      </div>
      <HighlightLayer mode={showViolations ? 'Violation Mode' : 'Standard Mode'} />
      {compareMode && <div className="compare-split">Synchronized previous plan view</div>}
    </div>
  )
}
