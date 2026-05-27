import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../utils/theme';

const { width } = Dimensions.get('window');

const CustomAlert = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'alert', // 'alert', 'confirm', 'success'
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  useImperativeHandle(ref, () => ({
    show: (config) => {
      setAlertConfig({
        title: config.title || '',
        message: config.message || '',
        type: config.type || 'alert',
        onConfirm: config.onConfirm || null,
        onCancel: config.onCancel || null,
        confirmText: config.confirmText || 'OK',
        cancelText: config.cancelText || 'Cancel',
      });
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
    }
  }));

  const handleConfirm = () => {
    setVisible(false);
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
  };

  const handleCancel = () => {
    setVisible(false);
    if (alertConfig.onCancel) {
      alertConfig.onCancel();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          
          {/* Icon Header */}
          <View style={styles.iconContainer}>
            {alertConfig.type === 'success' ? (
              <MaterialCommunityIcons name="check-circle" size={42} color={colors.success} />
            ) : alertConfig.type === 'confirm' ? (
              <MaterialCommunityIcons name="help-circle" size={42} color={colors.accent} />
            ) : (
              <MaterialCommunityIcons name="alert-circle" size={42} color={colors.danger} />
            )}
          </View>

          <Text style={styles.title}>{alertConfig.title}</Text>
          {alertConfig.message ? (
            <Text style={styles.message}>{alertConfig.message}</Text>
          ) : null}

          <View style={styles.actionsContainer}>
            {alertConfig.type === 'confirm' && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>{alertConfig.cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                alertConfig.type === 'success' && { backgroundColor: colors.success },
                alertConfig.type === 'alert' && { backgroundColor: colors.danger }
              ]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{alertConfig.confirmText}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  alertBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: spacing.xxl,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    borderRadius: radius.xxl,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.xxl,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CustomAlert;
