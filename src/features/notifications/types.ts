export interface NotificationCategoryPreferences {
  push: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  messages: NotificationCategoryPreferences;
  borrowActivity: NotificationCategoryPreferences;
  reminders: NotificationCategoryPreferences;
}
