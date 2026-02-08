export enum NotificationType {
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_COMPLETED = 'lead_completed',
  LEAD_RECEIVED = 'lead_received', // Nuevo lead recibido (para admins)
  LEAD_QUEUED = 'lead_queued', // Lead en cola sin vendedor (para admins)
  QUEUE_ALERT = 'queue_alert', // Alerta de cola (3+ leads)
  LEAD_URGENT = 'lead_urgent', // Lead crítico (10+ min en cola)
  QUOTATION_CREATED = 'quotation_created',
  QUOTATION_ACCEPTED = 'quotation_accepted',
  QUOTATION_REJECTED = 'quotation_rejected',
  SYSTEM_ALERT = 'system_alert',
}
