export default function Table({ columns, rows, sticky = true }) {
  return (
    <div className="table-wrap">
      <table className={`table ${sticky ? 'sticky' : ''}`}>
        <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
