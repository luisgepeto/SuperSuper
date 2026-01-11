import { Modal, Card, Button, AlertTriangleIcon } from './ui';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card variant="default" padding="lg" className="max-w-sm w-full">
        <Card.Header>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-error-light rounded-lg">
              <AlertTriangleIcon size={18} className="text-error" />
            </div>
            <Card.Title>{title}</Card.Title>
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-warm-600 mb-4">
            {message}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              fullWidth
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </Modal>
  );
};

export default ConfirmationModal;
