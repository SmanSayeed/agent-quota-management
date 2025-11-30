import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions, className }) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className={`modal-box max-w-2xl w-[95%] sm:w-full p-4 sm:p-6 ${className || ''}`}>
        <form method="dialog">
          {/* Larger touch target for mobile */}
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 min-h-[2.5rem] min-w-[2.5rem]" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </form>
        {title && <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 pr-8">{title}</h3>}
        <div className="py-2 sm:py-4">{children}</div>
        {actions && <div className="modal-action flex-col sm:flex-row gap-2">{actions}</div>}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default Modal;
