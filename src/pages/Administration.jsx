import { SystemAdminPanel } from '../components/redistribution/RedistributionPanels';
import React, { useState } from 'react';
import {
  Settings2,
  Users,
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  FileText,
  UserPlus,
  Star,
  MessageSquare,
  Lock,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertOctagon,
  CheckCircle,
  Wallet,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatCard } from '../components/ui/StatCard';
import { ROLES } from '../utils/roleDetector';

export function Administration() {
  const {
    users,
    addUser,
    deleteUser,
    editUser,
    hospitals,
    addHospital,
    feedbacks,
    currentUser,
    patients,
    beds,
    appointments,
    showToast,
  } = useHealthcare();

  // Tabs: 'users' | 'hospitals' | 'feedback' | 'staff-payroll' | 'analytics' | 'logs'
  const [activeTab, setActiveTab] = useState('users');

  // Search & Filter state for User Directory
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '9876543210',
    assignedRole: ROLES.DOCTOR,
    department: 'General Medicine',
    hospitalNode: hospitals[0]?.name || 'Bengaluru Central Hospital',
    status: 'Active',
  });

  // Edit User Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Add Hospital Node Modal State
  const [addHospitalModalOpen, setAddHospitalModalOpen] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    code: '',
    location: '',
    contact: '+91 80 4000 1234',
    totalBeds: 150,
    icuBeds: 24,
    emergencyCapacity: 20,
    departments: ['General Medicine', 'Cardiology', 'Emergency & Trauma'],
  });

  // User Directory Filtered list
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.mobile && u.mobile.includes(userSearch));

    const matchRole = roleFilter === 'All' || u.assignedRole === roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    const res = addUser(userForm);
    if (res) {
      setAddUserModalOpen(false);
      setUserForm({
        name: '',
        email: '',
        mobile: '9876543210',
        assignedRole: ROLES.DOCTOR,
        department: 'General Medicine',
        hospitalNode: hospitals[0]?.name || 'Bengaluru Central Hospital',
        status: 'Active',
      });
    }
  };

  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    if (!editingUserId) return;
    editUser(editingUserId, userForm);
    setEditUserModalOpen(false);
    setEditingUserId(null);
  };

  const handleOpenEdit = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      mobile: user.mobile || '9876543210',
      assignedRole: user.assignedRole || user.role,
      department: user.department || 'General Medicine',
      hospitalNode: user.hospitalNode,
      status: user.status || 'Active',
    });
    setEditUserModalOpen(true);
  };

  const handleCreateHospital = (e) => {
    e.preventDefault();
    if (!hospitalForm.name.trim() || !hospitalForm.location.trim()) {
      showToast('Hospital name and location are required', 'error');
      return;
    }
    addHospital(hospitalForm);
    setAddHospitalModalOpen(false);
    setHospitalForm({
      name: '',
      code: '',
      location: '',
      contact: '+91 80 4000 1234',
      totalBeds: 150,
      icuBeds: 24,
      emergencyCapacity: 20,
      departments: ['General Medicine', 'Cardiology', 'Emergency & Trauma'],
    });
  };

  return (
    <div className="space-y-6">
      <SystemAdminPanel />
      {/* Add User Modal */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="Add Staff User to Directory"
        subtitle="Create an authorized healthcare administrative record"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Dr. Rajeshwari Rao"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />

          <Input
            label="Email Address"
            required
            type="email"
            placeholder="e.g. rajeshwari.doctor@gmail.com"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <Input
            label="Mobile Number"
            type="tel"
            placeholder="10-digit mobile"
            value={userForm.mobile}
            onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
          />

          <Select
            label="Assigned Role"
            options={Object.values(ROLES)}
            value={userForm.assignedRole}
            onChange={(e) => setUserForm({ ...userForm, assignedRole: e.target.value })}
          />

          <Select
            label="Department"
            options={[
              'General Medicine',
              'Cardiology',
              'Pediatrics',
              'Orthopedics',
              'Emergency & Trauma',
              'Pharmacy',
              'Diagnostic Labs',
              'Administration & Billing',
            ]}
            value={userForm.department || 'General Medicine'}
            onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
          />

          <Select
            label="Hospital Node"
            options={hospitals.map((h) => h.name)}
            value={userForm.hospitalNode}
            onChange={(e) => setUserForm({ ...userForm, hospitalNode: e.target.value })}
          />

          <Select
            label="Account Status"
            options={['Active', 'Inactive']}
            value={userForm.status}
            onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save User Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="Edit Staff User Record"
        subtitle="Update authorization and facility assignment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
          <Input
            label="Full Name"
            required
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />

          <Input
            label="Email Address"
            required
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <Input
            label="Mobile Number"
            type="tel"
            value={userForm.mobile}
            onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
          />

          <Select
            label="Assigned Role"
            options={Object.values(ROLES)}
            value={userForm.assignedRole}
            onChange={(e) => setUserForm({ ...userForm, assignedRole: e.target.value })}
          />

          <Select
            label="Department"
            options={[
              'General Medicine',
              'Cardiology',
              'Pediatrics',
              'Orthopedics',
              'Emergency & Trauma',
              'Pharmacy',
              'Diagnostic Labs',
              'Administration & Billing',
            ]}
            value={userForm.department || 'General Medicine'}
            onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
          />

          <Select
            label="Hospital Node"
            options={hospitals.map((h) => h.name)}
            value={userForm.hospitalNode}
            onChange={(e) => setUserForm({ ...userForm, hospitalNode: e.target.value })}
          />

          <Select
            label="Account Status"
            options={['Active', 'Inactive']}
            value={userForm.status}
            onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Hospital Node Modal */}
      <Modal
        isOpen={addHospitalModalOpen}
        onClose={() => setAddHospitalModalOpen(false)}
        title="Register New Hospital Node"
        subtitle="Expands the municipal City Grid with a new healthcare facility"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateHospital} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hospital Name"
              required
              placeholder="e.g. Apex Multispecialty Hospital"
              value={hospitalForm.name}
              onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
            />
            <Input
              label="Node Code (3-4 chars)"
              placeholder="e.g. APX"
              value={hospitalForm.code}
              onChange={(e) => setHospitalForm({ ...hospitalForm, code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location / Area"
              required
              placeholder="e.g. Electronic City Phase 1"
              value={hospitalForm.location}
              onChange={(e) => setHospitalForm({ ...hospitalForm, location: e.target.value })}
            />
            <Input
              label="Contact Number"
              placeholder="+91 80 4000 0000"
              value={hospitalForm.contact}
              onChange={(e) => setHospitalForm({ ...hospitalForm, contact: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Total Bed Capacity"
              type="number"
              value={hospitalForm.totalBeds}
              onChange={(e) => setHospitalForm({ ...hospitalForm, totalBeds: e.target.value })}
            />
            <Input
              label="ICU Bed Units"
              type="number"
              value={hospitalForm.icuBeds}
              onChange={(e) => setHospitalForm({ ...hospitalForm, icuBeds: e.target.value })}
            />
            <Input
              label="Emergency Bays"
              type="number"
              value={hospitalForm.emergencyCapacity}
              onChange={(e) => setHospitalForm({ ...hospitalForm, emergencyCapacity: e.target.value })}
            />
          </div>

          <p className="text-[11px] text-teal-600 dark:text-teal-400">
            ✓ Once created, this hospital node will immediately appear in all selectors and dashboards across the operating system.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setAddHospitalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Register Hospital Node
            </Button>
          </div>
        </form>
      </Modal>

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            User access control, municipal hospital nodes configuration, and audit logging.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 self-start overflow-x-auto max-w-full">
          {[
            { key: 'users', label: 'User Directory', icon: Users },
            { key: 'hospitals', label: `Hospital Nodes (${hospitals.length})`, icon: Building2 },
            { key: 'staff-payroll', label: 'Staff & Payroll (RBAC)', icon: Wallet },
            { key: 'analytics', label: 'Hospital Analytics', icon: BarChart3 },
            { key: 'feedback', label: `Patient Feedback (${feedbacks?.length || 0})`, icon: Star },
            { key: 'logs', label: 'Audit Logs', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: USER DIRECTORY */}
      {activeTab === 'users' && (
        <Card
          noPadding
          title="Staff User Directory"
          subtitle="Administrative roster of created users (Demo login accounts are kept separate)"
          headerAction={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddUserModalOpen(true)}
              icon={UserPlus}
            >
              Add User
            </Button>
          }
        >
          {/* Filter toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Roles</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* User Table or Empty State */}
          {filteredUsers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No active demo users"
                description="The user directory is currently unpopulated. Click below to add staff records to this facility."
                actionLabel="Add First User"
                onAction={() => setAddUserModalOpen(true)}
                actionIcon={UserPlus}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Hospital Node</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {u.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={u.assignedRole || u.role} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {u.department || 'General Medicine'}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {u.hospitalNode}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {u.mobile || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
                            editUser(u.id, { ...u, status: newStatus });
                          }}
                          className="cursor-pointer hover:opacity-80"
                          title="Click to toggle status (Active / Inactive)"
                        >
                          <Badge variant={u.status === 'Active' ? 'success' : 'default'} size="sm" dot>
                            {u.status || 'Active'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {u.createdDate}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit user"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: HOSPITAL NODES */}
      {activeTab === 'hospitals' && (
        <Card
          noPadding
          title="Regional Hospital Nodes"
          subtitle="Governed facilities participating in the Arogya Queue City Health Grid"
          headerAction={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddHospitalModalOpen(true)}
              icon={Plus}
            >
              Add Hospital Node
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Node Code</th>
                  <th className="px-4 py-3">Hospital Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Beds / ICU</th>
                  <th className="px-4 py-3">Departments</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {hosp.code || hosp.id}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {hosp.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {hosp.location}
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {hosp.totalBeds} total / <span className="text-teal-600 dark:text-teal-400 font-bold">{hosp.icuBeds} ICU</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {hosp.departments?.slice(0, 3).join(', ')}...
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          hosp.status === 'Critical' || hosp.status === 'Emergency'
                            ? 'danger'
                            : hosp.status === 'Busy'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {hosp.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <Card title="System Operational Audit Trail" subtitle="Cryptographically indexed event trail">
          <div className="space-y-3 text-xs">
            {[
              { event: 'Inter-hospital referral handoff completed (REF-2026-001)', time: '10:45 AM', user: 'Central Triage Officer' },
              { event: 'Ambulance KA-01-GA-4501 dispatched to Indiranagar emergency call', time: '10:20 AM', user: 'Emergency Dispatcher' },
              { event: 'Medicine redistribution: 100 units Amoxicillin transferred BCH -> CCH', time: '09:55 AM', user: 'Chief Pharmacist' },
              { event: 'Bed ICU-01 status updated to Occupied (Patient: Ramesh Sundaram)', time: '09:50 AM', user: 'Senior Inpatient Nurse' },
              { event: 'New patient registered: Ramesh Sundaram (Token: AQ-2026-1001)', time: '09:45 AM', user: 'Reception Kiosk' },
            ].map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.event}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{log.user}</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: PATIENT EXPERIENCE & FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Average Patient Rating"
              value={`${(
                feedbacks && feedbacks.length > 0
                  ? feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / feedbacks.length
                  : 5.0
              ).toFixed(1)} / 5.0`}
              subtitle="Aggregated clinical satisfaction score"
              icon={Star}
              variant="amber"
            />
            <StatCard
              title="Satisfaction Index"
              value={`${
                feedbacks && feedbacks.length > 0
                  ? Math.round(
                      (feedbacks.filter((f) => (Number(f.rating) || 5) >= 4).length / feedbacks.length) * 100
                    )
                  : 100
              }%`}
              subtitle="Reviews with 4 or 5 stars"
              icon={CheckCircle2}
              variant="emerald"
            />
            <StatCard
              title="Total Feedback Logs"
              value={`${feedbacks?.length || 0} Entries`}
              subtitle="Registered patient submissions"
              icon={MessageSquare}
              variant="teal"
            />
          </div>

          {/* Feedback Feed */}
          <Card
            title="Patient Experience & Reviews Stream"
            subtitle="Real-time feedback submitted across hospital nodes"
          >
            <div className="space-y-3 text-xs">
              {!feedbacks || feedbacks.length === 0 ? (
                <p className="p-8 text-center text-slate-400">No feedback entries recorded yet.</p>
              ) : (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                          {fb.patientName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {fb.patientName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {fb.doctor} • {fb.department}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {fb.rating}.0
                        </span>
                      </div>
                    </div>

                    {/* Category tags */}
                    {fb.categories && fb.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {fb.categories.map((cat, i) => (
                          <Badge key={i} variant="teal" size="sm">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Comment text */}
                    {fb.comments && (
                      <p className="text-slate-700 dark:text-slate-300 text-xs bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 italic">
                        "{fb.comments}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Log Ref: {fb.id}</span>
                      <span>{fb.createdAt ? new Date(fb.createdAt).toLocaleString('en-IN') : 'Recent'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB: STAFF & PAYROLL (RBAC PROTECTED) */}
      {activeTab === 'staff-payroll' && (
        <div className="space-y-6">
          {currentUser?.role !== 'SUPER_ADMIN' ? (
            /* Explicit Access Denied Screen for Non-Super Admin */
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-lg space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <Badge variant="rose" size="lg" className="px-3 py-1 font-mono uppercase tracking-widest text-[11px]">
                Access Denied: Super Admin Authorization Required
              </Badge>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                Salary & Payroll Ledger Is Restricted
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hospital compensation ledgers, salary grades, bank account routing identifiers, and monthly disbursement cycles are encrypted under strict Hospital OS Governance Protocol (Section 44-B). Only credentials with the <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">SUPER_ADMIN</span> role can unlock and view payroll records.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-left max-w-md mx-auto space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Authenticated User:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Role:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{currentUser?.role || 'UNASSIGNED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Clearance:</span>
                  <span className="text-amber-500 font-bold">Standard Tier (Locked)</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('users')}>
                  Return to User Directory
                </Button>
              </div>
            </div>
          ) : (
            /* Super Admin View */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Monthly Payroll Commitment"
                  value="₹5,86,300"
                  icon={DollarSign}
                  color="teal"
                  description="Gross disbursement across all active hospital staff"
                />
                <StatCard
                  title="Average Monthly Remuneration"
                  value="₹97,716"
                  icon={TrendingUp}
                  color="blue"
                  description="Mean compensation per clinical & support head"
                />
                <StatCard
                  title="Payroll Status (Sep 2026)"
                  value="5 / 6 Disbursed"
                  icon={CheckCircle}
                  color="emerald"
                  description="83.3% successfully routed via NEFT/RTGS"
                />
                <StatCard
                  title="Statutory PF / TDS Reserve"
                  value="₹40,200"
                  icon={Wallet}
                  color="amber"
                  description="Retained regulatory compliance deductions"
                />
              </div>

              <Card
                noPadding
                title="Super Admin Staff & Payroll Ledger"
                subtitle="Authorized executive salary view with encrypted disbursement routing"
                headerAction={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => showToast('Monthly payroll cycle executed: All verified accounts disbursed', 'success')}
                  >
                    Execute Payroll Run
                  </Button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Role & Facility</th>
                        <th className="py-3 px-4">Base Salary</th>
                        <th className="py-3 px-4">Allowances</th>
                        <th className="py-3 px-4">Deductions</th>
                        <th className="py-3 px-4">Net Payout</th>
                        <th className="py-3 px-4">Bank Routing</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[
                        { id: 'STF-101', name: 'Dr. Priya Nair', role: 'DOCTOR', department: 'General Medicine', base: 145000, allow: 35000, ded: 12000, net: 168000, bank: 'HDFC •••• 4492', status: 'Disbursed' },
                        { id: 'STF-102', name: 'Dr. Arvind Sharma', role: 'DOCTOR', department: 'Cardiology', base: 185000, allow: 45000, ded: 15000, net: 215000, bank: 'SBI •••• 8821', status: 'Disbursed' },
                        { id: 'STF-103', name: 'Sister Mary Joseph', role: 'HEAD_NURSE', department: 'ICU & Emergency', base: 62000, allow: 12000, ded: 4500, net: 69500, bank: 'ICICI •••• 3109', status: 'Disbursed' },
                        { id: 'STF-104', name: 'Rajesh Kumar', role: 'PHARMACIST', department: 'Pharmacy', base: 48000, allow: 8000, ded: 3500, net: 52500, bank: 'Axis •••• 7712', status: 'Disbursed' },
                        { id: 'STF-105', name: 'Deepak Verma', role: 'LAB_TECH', department: 'Diagnostic Labs', base: 42000, allow: 7500, ded: 3000, net: 46500, bank: 'Canara •••• 9901', status: 'Pending Approval' },
                        { id: 'STF-106', name: 'Ananya Deshmukh', role: 'RECEPTIONIST', department: 'Patient Intake', base: 32000, allow: 5000, ded: 2200, net: 34800, bank: 'Kotak •••• 6645', status: 'Disbursed' },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <RoleBadge role={item.role} />
                            <span className="text-[10px] text-slate-400 block mt-0.5">{item.department}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                            ₹{item.base.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                            +₹{item.allow.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-500">
                            -₹{item.ded.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                            ₹{item.net.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {item.bank}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={item.status === 'Disbursed' ? 'emerald' : 'amber'} size="sm">
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB: HOSPITAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Daily Patient Footfall"
              value={patients.length + 42}
              icon={Users}
              color="teal"
              description="Outpatient and inpatient consultations today"
            />
            <StatCard
              title="Bed Occupancy Index"
              value={`${Math.round((beds.filter((b) => b.status === 'Occupied').length / Math.max(1, beds.length)) * 100)}%`}
              icon={Building2}
              color="blue"
              description={`${beds.filter((b) => b.status === 'Occupied').length} of ${beds.length} beds currently occupied`}
            />
            <StatCard
              title="Avg. Consultation Duration"
              value="11.4 mins"
              icon={TrendingUp}
              color="emerald"
              description="Calculated across 8 outpatient specialties"
            />
            <StatCard
              title="Advance Bookings"
              value={appointments?.length || 8}
              icon={Star}
              color="amber"
              description="Pre-scheduled consultations for the week"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Patient Distribution */}
            <Card
              title="Department Patient Distribution"
              subtitle="Active outpatient and emergency caseload by specialty"
            >
              <div className="space-y-4 text-xs">
                {[
                  { dept: 'General Medicine', count: 18, pct: 36, color: 'bg-teal-500' },
                  { dept: 'Cardiology', count: 12, pct: 24, color: 'bg-rose-500' },
                  { dept: 'Emergency & Trauma', count: 8, pct: 16, color: 'bg-amber-500' },
                  { dept: 'Pediatrics', count: 6, pct: 12, color: 'bg-blue-500' },
                  { dept: 'Orthopedics', count: 4, pct: 8, color: 'bg-purple-500' },
                  { dept: 'ENT & Ophthalmic', count: 2, pct: 4, color: 'bg-slate-400' },
                ].map((item) => (
                  <div key={item.dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.dept}</span>
                      <span className="font-mono text-slate-500">{item.count} patients ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ward Bed Utilization Breakdown */}
            <Card
              title="Ward Bed Occupancy Rates"
              subtitle="Real-time bed availability across hospital inpatient wards"
            >
              <div className="space-y-4 text-xs">
                {[
                  { ward: 'Intensive Care Unit (ICU)', total: 10, occupied: 7, pct: 70, color: 'bg-rose-500' },
                  { ward: 'Emergency Observation', total: 8, occupied: 5, pct: 62, color: 'bg-amber-500' },
                  { ward: 'General Medical Ward (Male)', total: 16, occupied: 11, pct: 68, color: 'bg-teal-500' },
                  { ward: 'General Medical Ward (Female)', total: 16, occupied: 9, pct: 56, color: 'bg-blue-500' },
                  { ward: 'Pediatric Care Unit', total: 8, occupied: 3, pct: 37, color: 'bg-emerald-500' },
                ].map((ward) => (
                  <div key={ward.ward} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ward.ward}</span>
                      <span className="font-mono text-slate-500">{ward.occupied} / {ward.total} Beds ({ward.pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ward.color}`}
                        style={{ width: `${ward.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
