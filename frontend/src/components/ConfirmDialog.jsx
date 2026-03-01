import Modal from './Modal.jsx'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmClass = 'btn-danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message || 'Are you sure you want to proceed?'}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`btn ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
