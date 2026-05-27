let alertRef = null;

export const setAlertRef = (ref) => {
  alertRef = ref;
};

export const AlertService = {
  alert: (title, message, type = 'alert') => {
    if (alertRef) {
      alertRef.show({ title, message, type });
    }
  },
  confirm: (title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'confirm') => {
    if (alertRef) {
      alertRef.show({ title, message, onConfirm, onCancel, confirmText, cancelText, type });
    }
  },
  success: (title, message) => {
    if (alertRef) {
      alertRef.show({ title, message, type: 'success' });
    }
  },
};
