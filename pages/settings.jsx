import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/components/auth-context";
import { HiOutlineCog, HiOutlineUser, HiOutlineGlobe, HiOutlineBell } from "react-icons/hi";

export default function Settings() {
  const { user, profile } = useAuth();
  const display = profile || user || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>

        {/* Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineUser className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={display.name || ""} disabled className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={display.email || ""} disabled className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input type="text" value={display.role ? display.role.charAt(0).toUpperCase() + display.role.slice(1) : "Not assigned"} disabled className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Site</label>
              <input type="text" value={display.assignedSite || "None"} disabled className="input bg-gray-50" />
            </div>
            {profile?.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={profile.phone} disabled className="input bg-gray-50" />
              </div>
            )}
          </div>
        </div>

        {/* Sync Settings */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineGlobe className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold text-gray-900">Sync & Offline</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage how your data syncs with the cloud. Offline mode allows you to work without internet.
          </p>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Offline Mode</p>
              <p className="text-sm text-muted-foreground">Work without internet connection</p>
            </div>
            <div className="w-11 h-6 bg-gray-300 rounded-full relative cursor-not-allowed">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineBell className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Notification settings coming soon.
          </p>
        </div>

        {/* About */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineCog className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>App: Ethiopian Contractor - Web</p>
            <p>Version: 1.0.0</p>
            <p>Database: Cloud Firestore (shared with Flutter app)</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
