export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl">⚠</span>
        <div>
          <p className="text-sm text-red-700">{message || 'An error occurred.'}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
