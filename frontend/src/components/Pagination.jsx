export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        «
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        ‹
      </button>
      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn btn-secondary btn-sm">1</button>
          {pages[0] > 2 && <span className="px-1 text-gray-500">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-500">…</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn btn-secondary btn-sm">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        »
      </button>
    </div>
  )
}
