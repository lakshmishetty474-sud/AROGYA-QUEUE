import React, { useState } from 'react';
import {
  Pill,
  ArrowLeftRight,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Search,
  Building2,
  PackageCheck,
  TrendingDown,
  LayoutGrid,
  List,
  Eye,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MotionStrip } from '../components/motion/MotionKit';
import { PharmacistRequestPanel, TargetHospitalPanel } from '../components/redistribution/RedistributionPanels';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TabletVisualBadge } from '../components/modules/TabletVisualBadge';
import { formatCurrency, formatTime } from '../utils/formatters';

export function Pharmacy() {
  const {
    medicines,
    activeHospitalId,
    hospitals,
    patients,
    transferMedicine,
    addMedicine,
    updatePatientStatus,
    showToast,
  } = useHealthcare();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'prescriptions' | 'transfers'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'gallery'
  const [selectedTabletModal, setSelectedTabletModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('All'); // 'All' | 'LowStock' | 'Adequate'

  // Add Medicine Modal State
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    dosageForm: 'Tablet',
    category: 'Antibiotics',
    batch: '',
    quantity: 100,
    minStock: 40,
    expiry: '2027-12-31',
    unitPrice: 15,
  });

  // Redistribution Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromHospitalId: activeHospitalId,
    toHospitalId: 'HOSP-02',
    medicineName: 'Amoxicillin',
    quantity: 100,
    reason: 'Critical shortage relief in Pediatric ward',
  });

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];
  const hospitalMeds = medicines.filter((m) => m.hospitalId === activeHospitalId);

  // Active prescriptions derived from patients who were prescribed medicines
  const activePrescriptionPatients = patients.filter(
    (p) => p.hospitalId === activeHospitalId && p.prescriptions && p.prescriptions.length > 0
  );

  // Filtered inventory
  const filteredMeds = hospitalMeds.filter((m) => {
    const matchSearch =
      !searchTerm ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.batch.toLowerCase().includes(searchTerm.toLowerCase());

    const isLow = m.quantity < m.minStock;
    const matchStock =
      stockFilter === 'All'
        ? true
        : stockFilter === 'LowStock'
        ? isLow
        : !isLow;

    return matchSearch && matchStock;
  });

  const lowStockCount = hospitalMeds.filter((m) => m.quantity < m.minStock).length;

  const handleAddMedSubmit = async (e) => {
    e.preventDefault();
    if (!newMedForm.name.trim()) {
      showToast('Please enter medicine name', 'error');
      return;
    }
    await addMedicine({
      ...newMedForm,
      hospitalId: activeHospitalId,
    });
    setAddMedModalOpen(false);
    setNewMedForm({
      name: '',
      dosageForm: 'Tablet',
      category: 'Antibiotics',
      batch: '',
      quantity: 100,
      minStock: 40,
      expiry: '2027-12-31',
      unitPrice: 15,
    });
  };

  const handleDispenseRx = (patient) => {
    updatePatientStatus(patient.id, 'Discharged', 'Medications verified & dispensed by Pharmacy');
    showToast(`Prescription dispensed for ${patient.name}`, 'success');
  };

  return (
    <div className="space-y-6">
      <TargetHospitalPanel />

      <PharmacistRequestPanel />

      <MotionStrip variant="pharmacy" />
      {/* Add Medicine Modal */}
      <Modal
        isOpen={addMedModalOpen}
        onClose={() => setAddMedModalOpen(false)}
        title="Add New Medicine to Stock"
        subtitle={`Register pharmaceutical item at ${activeHospital?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddMedSubmit} className="space-y-3 text-xs">
          <Input
            label="Medicine & Strength *"
            placeholder="e.g. Paracetamol 650mg"
            value={newMedForm.name}
            onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Dosage Form"
              options={[
                { value: 'Tablet', label: 'Tablet' },
                { value: 'Capsule', label: 'Capsule' },
                { value: 'Syrup', label: 'Syrup' },
                { value: 'Injection', label: 'Injection' },
                { value: 'IV Infusion', label: 'IV Infusion' },
                { value: 'Ointment', label: 'Ointment' },
              ]}
              value={newMedForm.dosageForm}
              onChange={(e) => setNewMedForm({ ...newMedForm, dosageForm: e.target.value })}
            />
            <Select
              label="Category"
              options={[
                { value: 'Antibiotics', label: 'Antibiotics' },
                { value: 'Analgesics', label: 'Analgesics' },
                { value: 'Cardiovascular', label: 'Cardiovascular' },
                { value: 'Respiratory', label: 'Respiratory' },
                { value: 'Antidiabetic', label: 'Antidiabetic' },
                { value: 'Emergency', label: 'Emergency' },
              ]}
              value={newMedForm.category}
              onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Batch Number"
              placeholder="e.g. B8829"
              value={newMedForm.batch}
              onChange={(e) => setNewMedForm({ ...newMedForm, batch: e.target.value })}
            />
            <Input
              label="Unit Price (₹)"
              type="number"
              value={newMedForm.unitPrice}
              onChange={(e) => setNewMedForm({ ...newMedForm, unitPrice: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Stock Quantity"
              type="number"
              value={newMedForm.quantity}
              onChange={(e) => setNewMedForm({ ...newMedForm, quantity: e.target.value })}
            />
            <Input
              label="Min Safety Stock"
              type="number"
              value={newMedForm.minStock}
              onChange={(e) => setNewMedForm({ ...newMedForm, minStock: e.target.value })}
            />
          </div>
          <Input
            label="Expiry Date"
            type="date"
            value={newMedForm.expiry}
            onChange={(e) => setNewMedForm({ ...newMedForm, expiry: e.target.value })}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setAddMedModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Save to Supabase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Pharmacy & Supply Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pharmaceutical dispensing, batch inventory tracking, and municipal supply redistribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddMedModalOpen(true)}
            icon={Plus}
          >
            Add Medicine
          </Button>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-200"
            title="Stock can no longer be moved directly between hospitals"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            <span>
              Transfers now require <strong>Hospital Admin</strong> then <strong>System Admin</strong> approval -
              use Request Medicine Redistribution below.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Low-stock Alert banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 self-start">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Inventory ({hospitalMeds.length})
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Active Prescriptions ({activePrescriptionPatients.length})
          </button>
        </div>

        {lowStockCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{lowStockCount} medicines below safety reserve threshold</span>
          </div>
        )}
      </div>

      {/* Tablet 3D Inspection & Anti-Counterfeit Verification Modal */}
      {selectedTabletModal && (
        <Modal
          isOpen={Boolean(selectedTabletModal)}
          onClose={() => setSelectedTabletModal(null)}
          title={`Pharmaceutical Pill Profile: ${selectedTabletModal.name}`}
          subtitle={`Physical Form, Anti-Counterfeit Imprint & Batch Specifications`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            {/* Visual Header */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 border border-teal-200/50 dark:border-teal-900/50">
              <div className="relative group shrink-0">
                <TabletVisualBadge
                  name={selectedTabletModal.name}
                  dosageForm={selectedTabletModal.dosageForm}
                  shape={selectedTabletModal.shape}
                  primaryColor={selectedTabletModal.primaryColor}
                  secondaryColor={selectedTabletModal.secondaryColor}
                  imprint={selectedTabletModal.imprint || selectedTabletModal.name?.slice(0, 3)?.toUpperCase()}
                  size="lg"
                  className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700"
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 whitespace-nowrap">
                  <ShieldCheck className="w-2.5 h-2.5" /> Authentic Spec
                </span>
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <Badge variant="teal" size="sm">
                    {selectedTabletModal.category}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {selectedTabletModal.shape || 'Standard Tablet'}
                  </Badge>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedTabletModal.name} {selectedTabletModal.dosageForm}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Imprint Code: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{selectedTabletModal.imprint || 'MED'}</span> • Packaging: {selectedTabletModal.packaging || 'Blister Pack'}
                </p>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Batch Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {selectedTabletModal.batch}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {selectedTabletModal.expiry}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Formulary Stock</span>
                <span className={`font-mono font-bold text-xs ${selectedTabletModal.quantity < selectedTabletModal.minStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedTabletModal.quantity} units
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Safety Reserve</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {selectedTabletModal.minStock} units
                </span>
              </div>
            </div>

            {/* Visual Identification Specs */}
            <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/60 space-y-2">
              <h4 className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Pill Dispensing & Authentication Checklist</span>
              </h4>
              <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <li>• <strong>Tablet Geometry:</strong> {selectedTabletModal.shape || 'Round Scored'} with debossed center scoring</li>
                <li>• <strong>Surface Imprint:</strong> "{selectedTabletModal.imprint || 'MED'}" debossed for counterfeit identification</li>
                <li>• <strong>Administration Route:</strong> {selectedTabletModal.administration || 'Oral'}</li>
                <li>• <strong>Standard Unit Price:</strong> ₹{selectedTabletModal.unitPrice || '10.00'} per unit / strip</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTabletModal(null)}>
                Close Inspector
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  showToast(`Medication ${selectedTabletModal.name} verified authentic`, 'success');
                  setSelectedTabletModal(null);
                }}
                icon={CheckCircle2}
              >
                Mark Verified
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* TAB 1: INVENTORY & STOCK */}
      {activeTab === 'inventory' && (
        <Card noPadding title="Pharmaceutical Inventory Ledger" subtitle={`Formulary at ${activeHospital?.name}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medicine name, category, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="All">All Stock Levels</option>
                <option value="LowStock">Low Stock Only</option>
                <option value="Adequate">Adequate Only</option>
              </select>

              {/* View Switcher: Table vs Visual Cards */}
              <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'gallery'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Visual Tablet Gallery"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: TABLE WITH TABLET VISUAL BADGES */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tablet Image & Medicine</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Imprint / Shape</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">In Stock</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMeds.map((med) => {
                    const isLow = med.quantity < med.minStock;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <TabletVisualBadge
                              name={med.name}
                              dosageForm={med.dosageForm}
                              shape={med.shape}
                              primaryColor={med.primaryColor}
                              secondaryColor={med.secondaryColor}
                              imprint={med.imprint || med.name?.slice(0, 3)?.toUpperCase()}
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => setSelectedTabletModal(med)}
                            />
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {med.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{med.dosageForm}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {med.category}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded text-[11px]">
                            {med.imprint || 'MED'}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {med.shape || 'Round Scored'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          {med.batch}
                        </td>

                        <td className="px-4 py-3.5 font-bold font-mono">
                          <span className={isLow ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-slate-100'}>
                            {med.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            Min: {med.minStock}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {med.expiry}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={isLow ? 'warning' : 'success'} size="sm" dot>
                            {isLow ? 'Low Stock' : 'Adequate'}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTabletModal(med)}
                            icon={Eye}
                            title="Inspect 3D Pill & Specifications"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW MODE 2: VISUAL TABLET CARDS GALLERY */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMeds.map((med) => {
                const isLow = med.quantity < med.minStock;
                return (
                  <div
                    key={med.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500/50 hover:shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Pill Image Container */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={isLow ? 'warning' : 'teal'} size="sm">
                          {med.category}
                        </Badge>
                        <span className="font-mono text-[10px] text-slate-400">{med.batch}</span>
                      </div>

                      <div className="flex justify-center my-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl group-hover:scale-105">
                        <TabletVisualBadge
                          name={med.name}
                          dosageForm={med.dosageForm}
                          shape={med.shape}
                          primaryColor={med.primaryColor}
                          secondaryColor={med.secondaryColor}
                          imprint={med.imprint || med.name?.slice(0, 3)?.toUpperCase()}
                          size="lg"
                        />
                      </div>

                      <div className="text-center mt-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {med.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{med.dosageForm}</p>
                      </div>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pill Shape:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{med.shape || 'Round Scored'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Imprint Code:</span>
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{med.imprint || 'MED'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">In Stock:</span>
                          <span className={`font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                            {med.quantity} / Min: {med.minStock}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Expiry:</span>
                          <span className="font-mono text-slate-500">{med.expiry}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs justify-center"
                        icon={Eye}
                        onClick={() => setSelectedTabletModal(med)}
                      >
                        Inspect Specifications
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: ACTIVE DOCTOR PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <Card
            noPadding
            title="Active E-Prescriptions Queue"
            subtitle="Prescriptions transmitted from Doctor consultation rooms awaiting fulfillment"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Token #</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Prescribed Medications</th>
                    <th className="px-4 py-3">Consulting Doctor</th>
                    <th className="px-4 py-3">Queue Status</th>
                    <th className="px-4 py-3 text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activePrescriptionPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No active e-prescriptions waiting in this facility.
                      </td>
                    </tr>
                  ) : (
                    activePrescriptionPatients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {pat.token}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{pat.name}</span>
                          <span className="text-[10px] text-slate-400">{pat.age} yrs • {pat.mobile}</span>
                        </td>

                        <td className="px-4 py-3.5 space-y-1">
                          {pat.prescriptions.map((rx, idx) => (
                            <div key={idx} className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              • <span className="font-bold text-teal-700 dark:text-teal-300">{rx.medicine}</span> ({rx.dosage}, {rx.frequency} x {rx.duration})
                            </div>
                          ))}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {pat.doctor}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={pat.status === 'Pharmacy' ? 'warning' : 'success'} size="sm">
                            {pat.status === 'Pharmacy' ? 'Ready for Dispense' : pat.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleDispenseRx(pat)}
                            icon={CheckCircle2}
                          >
                            Dispense
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}