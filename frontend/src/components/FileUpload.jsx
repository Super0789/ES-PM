import { useRef } from 'react'

export default function FileUpload({ onFileSelect, accept = '*', multiple = false, label = 'Choose file' }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0]
    if (files) onFileSelect(files)
    e.target.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn btn-secondary"
      >
        <span className="mr-2">📎</span>
        {label}
      </button>
    </div>
  )
}
