export default function LoadMesh({ load, hovered, selected, invalid }) {
  const cls = [hovered && 'hover', selected && 'selected', invalid && 'invalid'].filter(Boolean).join(' ')
  return <div className={`load-mesh ${cls}`}>{load.id}</div>
}
