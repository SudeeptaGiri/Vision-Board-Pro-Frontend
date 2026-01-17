'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Bell,
  Palette,
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  Laptop,
  Save,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    timezone: 'UTC',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    dailyDigest: true,
    weeklyReport: true,
    goalDeadlines: true,
    habitReminders: true,
    pushNotifications: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/auth/profile', profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/notifications', notifications);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-warm-text dark:text-warm-bg">Settings</h1>
        <p className="text-warm-muted dark:text-warm-border mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-terracotta-light dark:bg-terracotta/20 text-terracotta dark:text-terracotta-light'
                    : 'text-warm-muted dark:text-warm-border hover:bg-warm-card dark:hover:bg-warm-muted/30'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="glass-card rounded-xl border border-warm-border p-6">
              <h2 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-6">
                Profile Information
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-white text-3xl font-bold">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-warm-muted border border-warm-border dark:border-warm-muted flex items-center justify-center shadow-sm hover:bg-warm-card dark:hover:bg-warm-muted/80">
                    <Camera className="w-4 h-4 text-warm-text dark:text-warm-border" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-warm-text dark:text-warm-bg">
                    Profile Photo
                  </h3>
                  <p className="text-sm text-warm-muted dark:text-warm-border">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Kolkata">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="glass-card rounded-xl border border-warm-border p-6">
              <h2 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                {[
                  {
                    key: 'emailReminders',
                    label: 'Email Reminders',
                    description: 'Receive email reminders for upcoming deadlines',
                  },
                  {
                    key: 'dailyDigest',
                    label: 'Daily Digest',
                    description: 'Get a daily summary of your tasks and progress',
                  },
                  {
                    key: 'weeklyReport',
                    label: 'Weekly Report',
                    description: 'Receive weekly progress reports',
                  },
                  {
                    key: 'goalDeadlines',
                    label: 'Goal Deadlines',
                    description: 'Be notified when goals are approaching their deadline',
                  },
                  {
                    key: 'habitReminders',
                    label: 'Habit Reminders',
                    description: 'Daily reminders to complete your habits',
                  },
                  {
                    key: 'pushNotifications',
                    label: 'Push Notifications',
                    description: 'Receive push notifications on your device',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-4 border-b border-warm-border dark:border-warm-muted last:border-0"
                  >
                    <div>
                      <h3 className="font-medium text-warm-text dark:text-warm-bg">
                        {item.label}
                      </h3>
                      <p className="text-sm text-warm-muted dark:text-warm-border">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [item.key]: !notifications[item.key as keyof typeof notifications],
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-sage'
                          : 'bg-warm-border dark:bg-warm-muted/50'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="glass-card rounded-xl border border-warm-border p-6">
              <h2 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-6">
                Appearance
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-warm-text dark:text-warm-bg mb-4">
                    Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Laptop },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                          theme === option.id
                            ? 'border-terracotta bg-terracotta-light dark:bg-terracotta/20'
                            : 'border-warm-border dark:border-warm-muted hover:border-terracotta/50 dark:hover:border-terracotta/50'
                        }`}
                      >
                        <option.icon
                          className={`w-8 h-8 ${
                            theme === option.id
                              ? 'text-terracotta dark:text-terracotta-light'
                              : 'text-coffee-medium dark:text-coffee-light'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            theme === option.id
                              ? 'text-coffee-dark dark:text-coffee-cream'
                              : 'text-coffee-medium dark:text-coffee-light'
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="glass-card rounded-xl border border-warm-border p-6">
              <h2 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-6">
                Security Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-warm-text dark:text-warm-bg mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Key className="w-4 h-4" />
                      {isSaving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>

                <hr className="border-warm-border dark:border-warm-muted" />

                <div>
                  <h3 className="font-medium text-warm-text dark:text-warm-bg mb-4">
                    Danger Zone
                  </h3>
                  <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">
                          Delete Account
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                          Once you delete your account, there is no going back. All your data will be permanently removed.
                        </p>
                        <Button variant="destructive" size="sm">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
