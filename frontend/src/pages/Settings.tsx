/**
 * Settings Page (T079)
 * 
 * User settings including Google Fit integration, preferences, and account management.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Button } from '../components/common';
import { GoogleFitConnect } from '../components/health/GoogleFitConnect';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </motion.header>
      
      {/* Account Section */}
      <motion.section
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-3">Account</h2>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-fitness-primary/20 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{user?.displayName || 'User'}</p>
              <p className="text-text-secondary text-sm">{user?.email}</p>
            </div>
          </div>
        </Card>
      </motion.section>
      
      {/* Google Fit Integration Section */}
      <motion.section
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-3">Integrations</h2>
        <GoogleFitConnect />
      </motion.section>
      
      {/* Preferences Section */}
      <motion.section
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-3">Preferences</h2>
        <Card className="space-y-4">
          <PreferenceItem
            icon="🏃"
            title="Show Warm-up"
            description="Display warm-up routine before workouts"
            enabled={true}
          />
          <PreferenceItem
            icon="🌙"
            title="Dark Mode"
            description="Use dark color theme"
            enabled={true}
          />
          <PreferenceItem
            icon="📅"
            title="Week Starts On"
            description="Monday"
            isDropdown
          />
        </Card>
      </motion.section>
      
      {/* Sign Out */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="secondary"
          className="w-full text-fitness-danger border-fitness-danger/30 hover:bg-fitness-danger/10"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </motion.section>
      
      <BottomNav />
      <div className="h-20" />
    </div>
  );
}

interface PreferenceItemProps {
  icon: string;
  title: string;
  description: string;
  enabled?: boolean;
  isDropdown?: boolean;
}

function PreferenceItem({ icon, title, description, enabled, isDropdown }: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-medium text-text-primary">{title}</p>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>
      </div>
      
      {isDropdown ? (
        <ChevronRightIcon className="w-5 h-5 text-text-muted" />
      ) : (
        <ToggleSwitch enabled={enabled || false} onChange={() => {}} />
      )}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-fitness-primary' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-gray-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex justify-around">
        <NavLink to="/today" icon="🏋️" label="Today" />
        <NavLink to="/plan" icon="📋" label="Plan" />
        <NavLink to="/history" icon="📊" label="History" />
        <NavLink to="/settings" icon="⚙️" label="Settings" />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  const isActive = window.location.pathname.startsWith(to);
  
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
        isActive ? 'text-fitness-primary' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
