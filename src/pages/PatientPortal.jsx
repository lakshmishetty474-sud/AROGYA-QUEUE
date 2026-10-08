import React, { useState } from 'react';
import {
  User,
  Clock,
  Stethoscope,
  Building2,
  Pill,
  Sparkles,
  Calendar,
  CalendarPlus,
  Star,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  PhoneCall,
  HelpCircle,
  Send,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Activity,
  Heart,
  Upload,
  BedDouble,
  Ambulance,
  Navigation,
  MapPin,
  AlertCircle,
  XCircle,
  Plus,
  Phone,
  Filter,
  QrCode,
  ScanFace,
  FileSpreadsheet,
  Printer,
  Receipt,
} from 'lucide-react';
import HealthVideoBanner from '../components/HealthVideoBanner';
import { CartoonHero } from '../components/motion/CartoonKit';
import { MotionStrip } from '../components/motion/MotionKit';
import { PatientVitalsPanel } from '../components/common/PatientVitalsPanel';
import { AuthSlideshow } from '../components/common/AuthSlideshow';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PatientJourneyTimeline } from '../components/modules/PatientJourneyTimeline';
import { InteractiveMap } from '../components/modules/InteractiveMap';
import { PaymentQRModal } from '../components/modules/PaymentQRModal';
import { BiometricFaceLoginModal } from '../components/modules/BiometricFaceLoginModal';
import { formatTime } from '../utils/formatters';
import { downloadPaymentReceipt, downloadDischargeSummary } from '../utils/exportHelpers';
import { DoctorAvailability } from '../components/duty/DutyViews';

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export function PatientPortal() {
  const {
    currentUser,
    patients,
    hospitals,
    activeHospitalId,
    appointments,
    bookAppointment,
    cancelAppointment,
    checkInAppointment,
    submitFeedback,
    supportTickets,
    submitSupportTicket,
    calculateQueueEta,
    showToast,
    uploadReport,
    beds,
    bedReservations,
    requestBedReservation,
    cancelBedReservation,
    ambulances,
    ambulanceRequests,
    requestAmbulance,
    cancelAmbulanceRequest,
    discharges = [],
    payments = [],
  } = useHealthcare();

  // Active Tab: 'journey' | 'reports' | 'beds' | 'ambulance' | 'prescriptions' | 'history' | 'support'
  const [portalTab, setPortalTab] = useState('journey');

  // Modal States
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [uploadReportModalOpen, setUploadReportModalOpen] = useState(false);
  const [bedReserveModalOpen, setBedReserveModalOpen] = useState(false);
  const [isEmergencyBedReq, setIsEmergencyBedReq] = useState(false);
  const [ambModalOpen, setAmbModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);

  // Active hospital
  const hospital = hospitals?.find((h) => h.id === activeHospitalId) || hospitals?.[0] || { name: 'Arogya Central Hospital' };

  // Booking Form State
  const [bookForm, setBookForm] = useState({
    hospitalId: activeHospitalId || 'HOSP-01',
    department: 'General Medicine',
    doctor: 'Dr. Priya Nair',
    date: getTomorrowDateString(),
    timeSlot: '10:30 AM',
    symptoms: '',
  });

  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategories, setFeedbackCategories] = useState(['Doctor Care', 'Wait Time']);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Support Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    category: 'Billing & Payments',
    subject: '',
    message: '',
  });

  // Find this patient's record in patients state
  const myRecord = patients.find(
    (p) =>
      p.id === currentUser?.patientId ||
      p.id === currentUser?.id ||
      (p.mobile && currentUser?.mobile && p.mobile === currentUser?.mobile) ||
      (p.token && currentUser?.token && p.token === currentUser?.token)
  ) || (currentUser?.role !== 'PATIENT' ? patients[0] : null);

  // Handlers
  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!bookForm.date || !bookForm.timeSlot) {
      showToast('Please select appointment date and time slot', 'error');
      return;
    }
    bookAppointment({
      ...bookForm,
      patientName: currentUser?.name || myRecord?.name || 'Walk-in Patient',
      mobile: currentUser?.mobile || myRecord?.mobile || '9876543210',
      email: currentUser?.email || '',
      age: myRecord?.age || 30,
      gender: myRecord?.gender || 'Other',
    });
    setBookModalOpen(false);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    submitFeedback({
      patientName: currentUser?.name || myRecord?.name || 'Patient',
      mobile: currentUser?.mobile || myRecord?.mobile || '',
      hospitalId: hospital?.id || activeHospitalId,
      department: myRecord?.department || 'General Medicine',
      doctor: myRecord?.doctor || 'Consultant Specialist',
      rating: feedbackRating,
      categories: feedbackCategories,
      comments: feedbackComment,
    });
    setFeedbackModalOpen(false);
    setFeedbackComment('');
  };

  const toggleFeedbackCategory = (cat) => {
    setFeedbackCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const userMobile = currentUser?.mobile || currentUser?.phone || myRecord?.mobile;
  const myAppointments = appointments.filter((apt) => {
    if (userMobile && apt.mobile === userMobile) return true;
    if (currentUser?.name && apt.patientName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  });
  const displayAppointments = myAppointments.length > 0 ? myAppointments : appointments.slice(0, 3);

  // Diagnostic Reports - Only actual/manual reports belonging to patient, initially EMPTY
  const diagnosticReports = myRecord?.reports || [];

  // Report Upload Form State
  const [uploadForm, setUploadForm] = useState({
    reportName: '',
    testType: 'Hematology',
    fileName: '',
    findings: '',
  });

  const handleUploadReportSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.reportName.trim()) {
      showToast('Please enter a report name or test title', 'error');
      return;
    }
    const finalFileName = uploadForm.fileName || `${uploadForm.reportName.replace(/\s+/g, '_')}.pdf`;
    await uploadReport(myRecord?.id || currentUser?.id || 'PAT-001', {
      reportName: uploadForm.reportName,
      testName: uploadForm.reportName,
      testType: uploadForm.testType,
      department: uploadForm.testType,
      doctor: myRecord?.doctor || 'Dr. Priya Nair',
      hospitalId: hospital?.id || activeHospitalId,
      fileName: finalFileName,
      findings: uploadForm.findings || `Clinical parameter values recorded for ${uploadForm.reportName}. Verified authentic report.`,
      uploadedBy: currentUser?.name || myRecord?.name || 'Patient',
      status: 'Available',
    });
    setUploadReportModalOpen(false);
    setUploadForm({
      reportName: '',
      testType: 'Hematology',
      fileName: '',
      findings: '',
    });
  };

  // Bed Availability & Reservation State
  const [selectedBedHospitalId, setSelectedBedHospitalId] = useState(activeHospitalId || 'HOSP-01');
  const [bedReserveForm, setBedReserveForm] = useState({
    ward: 'ICU',
    reason: '',
  });
  const [bedTypeFilter, setBedTypeFilter] = useState('All');
  const [viewBedsHospitalId, setViewBedsHospitalId] = useState(null);

  const selectedBedHospital = hospitals.find((h) => h.id === selectedBedHospitalId) || hospitals[0];
  const targetHospitalBeds = beds.filter((b) => b.hospitalId === selectedBedHospitalId);
  const totalBedsCount = targetHospitalBeds.length;
  const availableBedsCount = targetHospitalBeds.filter((b) => b.status === 'Available').length;
  const icuAvailableCount = targetHospitalBeds.filter((b) => b.ward === 'ICU' && b.status === 'Available').length;
  const emergencyAvailableCount = targetHospitalBeds.filter((b) => b.ward === 'Emergency' && b.status === 'Available').length;
  const generalAvailableCount = targetHospitalBeds.filter((b) => b.ward === 'General' && b.status === 'Available').length;
  const privateAvailableCount = targetHospitalBeds.filter((b) => b.ward === 'Private' && b.status === 'Available').length;
  const pediatricAvailableCount = targetHospitalBeds.filter((b) => b.ward === 'Pediatric' && b.status === 'Available').length;

  const myReservations = bedReservations.filter(
    (r) =>
      r.patientId === myRecord?.id ||
      r.patientId === currentUser?.id ||
      (userMobile && r.mobile === userMobile)
  );

  const handleBedReserveSubmit = (e) => {
    e.preventDefault();
    requestBedReservation({
      patientId: myRecord?.id || currentUser?.id || 'PAT-001',
      patientName: currentUser?.name || myRecord?.name || 'Rahul Sharma',
      mobile: currentUser?.mobile || myRecord?.mobile || '9876543210',
      hospitalId: selectedBedHospitalId,
      ward: bedReserveForm.ward,
      isEmergency: isEmergencyBedReq,
      reason: bedReserveForm.reason,
    });
    setBedReserveModalOpen(false);
    setBedReserveForm({ ward: 'ICU', reason: '' });
  };

  // Ambulance Request State
  const [ambForm, setAmbForm] = useState({
    pickupLocation: myRecord?.address || 'Indiranagar, Bengaluru',
    destinationHospitalId: activeHospitalId || 'HOSP-01',
    emergencyType: 'Medical Emergency',
    notes: '',
  });

  const myAmbulanceRequests = ambulanceRequests.filter(
    (r) =>
      r.patientId === myRecord?.id ||
      r.patientId === currentUser?.id ||
      (userMobile && r.mobile === userMobile)
  );
  const activeAmbulanceRequest = myAmbulanceRequests.find(
    (r) => r.status !== 'Completed' && r.status !== 'Cancelled'
  );

  const handleAmbulanceSubmit = (e) => {
    e.preventDefault();
    requestAmbulance({
      patientId: myRecord?.id || currentUser?.id || 'PAT-001',
      patientName: currentUser?.name || myRecord?.name || 'Rahul Sharma',
      mobile: currentUser?.mobile || myRecord?.mobile || '9876543210',
      pickupLocation: ambForm.pickupLocation,
      destinationHospitalId: ambForm.destinationHospitalId,
      emergencyType: ambForm.emergencyType,
      notes: ambForm.notes,
    });
    setAmbModalOpen(false);
    setPortalTab('ambulance');
  };

  // Support Tickets for this user
  const userTickets = supportTickets?.filter(
    (t) =>
      (userMobile && t.mobile === userMobile) ||
      (currentUser?.name && t.patientName && t.patientName.toLowerCase().includes(currentUser.name.toLowerCase()))
  ) || [];
  const displayTickets = userTickets.length > 0 ? userTickets : (supportTickets || []);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) {
      showToast('Please provide a subject for the support ticket', 'error');
      return;
    }
    submitSupportTicket({
      ...ticketForm,
      patientName: currentUser?.name || myRecord?.name || 'Patient',
      mobile: currentUser?.mobile || myRecord?.mobile || '9876543210',
    });
    setTicketModalOpen(false);
    setTicketForm({ category: 'Billing & Payments', subject: '', message: '' });
  };

  const handleDownloadReport = (rep) => {
    const fileName = rep.fileName || `${rep.testName}.pdf`;
    showToast(`Downloading official report: ${fileName}`, 'info');
    setTimeout(() => {
      const blob = new Blob([
        `AROGYA QUEUE DIAGNOSTIC REPORT\n--------------------------------\nReport ID: ${rep.id}\nTest Name: ${rep.testName}\nFile Name: ${fileName}\nDepartment: ${rep.department}\nOrdered By: ${rep.orderedBy}\nDate: ${rep.date}\nStatus: ${rep.status}\nFindings:\n${rep.findings}\nVerified by: ${rep.labTech}`
      ], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Report ${fileName} downloaded successfully`, 'success');
    }, 400);
  };

  // Reusable Modals
  const renderModals = () => (
    <>
      {/* Book Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Schedule OPD Appointment"
        subtitle="Book an advance outpatient specialist consultation"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBookSubmit} className="space-y-3.5 text-xs">
          <Select
            label="Select Hospital Node"
            options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
            value={bookForm.hospitalId}
            onChange={(e) => setBookForm({ ...bookForm, hospitalId: e.target.value })}
          />

          <Select
            label="Clinical Department"
            options={[
              'General Medicine',
              'Cardiology',
              'Pediatrics',
              'Orthopedics',
              'Emergency & Trauma',
              'ENT & Ophthalmic',
            ]}
            value={bookForm.department}
            onChange={(e) => setBookForm({ ...bookForm, department: e.target.value })}
          />

          <Select
            label="Specialist Doctor"
            options={[
              'Dr. Priya Nair',
              'Dr. Arvind Sharma',
              'Dr. Sneha Roy',
              'Dr. Rajeshwari Rao',
              'Dr. Ramesh Babu',
            ]}
            value={bookForm.doctor}
            onChange={(e) => setBookForm({ ...bookForm, doctor: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Consultation Date"
              type="date"
              required
              value={bookForm.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
            />

            <Select
              label="Time Slot"
              options={[
                '09:00 AM',
                '09:30 AM',
                '10:00 AM',
                '10:30 AM',
                '11:15 AM',
                '02:00 PM',
                '02:45 PM',
                '04:00 PM',
              ]}
              value={bookForm.timeSlot}
              onChange={(e) => setBookForm({ ...bookForm, timeSlot: e.target.value })}
            />
          </div>

          <Input
            label="Chief Symptoms / Reason for Visit"
            placeholder="e.g. Persistent fever, throat pain, routine follow-up"
            value={bookForm.symptoms}
            onChange={(e) => setBookForm({ ...bookForm, symptoms: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Experience & Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Rate Your Hospital Experience"
        subtitle="Your feedback directly guides clinical quality and queue efficiency"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
          {/* Star Rating Widget */}
          <div className="text-center py-2">
            <span className="text-slate-500 block mb-1 font-medium">Overall Care Rating</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className="p-1 rounded-lg hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= feedbackRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-amber-500 mt-1 block">
              {feedbackRating === 5
                ? 'Outstanding Care (5/5)'
                : feedbackRating === 4
                ? 'Very Good (4/5)'
                : feedbackRating === 3
                ? 'Average (3/5)'
                : 'Needs Improvement'}
            </span>
          </div>

          {/* Feedback Category Multi-select */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Highlight Areas:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Doctor Care', 'Wait Time', 'Facility Cleanliness', 'Staff Courtesy', 'Pharmacy Speed'].map(
                (cat) => {
                  const selected = feedbackCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleFeedbackCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {cat}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Comment text area */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Comments & Observations:
            </label>
            <textarea
              rows={3}
              placeholder="Tell us about the physician attention, queue speed, or pharmacy experience..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Raise a Support & Help Request"
        subtitle="Submit your query to the hospital patient grievance desk"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTicketSubmit} className="space-y-3.5 text-xs">
          <Select
            label="Inquiry Category"
            options={[
              'Billing & Payments',
              'Prescription & Medicine Query',
              'Diagnostic Report Delay',
              'OPD Queue & Token Assistance',
              'Emergency / Ambulance Dispatch',
              'General Complaint / Feedback',
            ]}
            value={ticketForm.category}
            onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
          />

          <Input
            label="Subject"
            required
            placeholder="Brief summary of your query or grievance"
            value={ticketForm.subject}
            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
          />

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description:
            </label>
            <textarea
              rows={4}
              required
              placeholder="Please explain the issue along with any bill or token numbers..."
              value={ticketForm.message}
              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Send}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Diagnostic Report Inspection Modal */}
      {selectedReportModal && (
        <Modal
          isOpen={Boolean(selectedReportModal)}
          onClose={() => setSelectedReportModal(null)}
          title={selectedReportModal.testName}
          subtitle={`Report ID: ${selectedReportModal.id} • ${selectedReportModal.department}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Ordering Physician:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReportModal.orderedBy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Date of Testing:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReportModal.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Report Status:</span>
                <Badge variant={selectedReportModal.status === 'Available' ? 'teal' : 'amber'} size="sm">
                  {selectedReportModal.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Biological Reference:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {selectedReportModal.normalRange}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Clinical Findings & Parameter Values</span>
              </h4>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedReportModal.findings}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Verified by: {selectedReportModal.labTech}</span>
              <span>Arogya Diagnostics Lab Node</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setSelectedReportModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => handleDownloadReport(selectedReportModal)}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Upload Diagnostic Report Modal */}
      {uploadReportModalOpen && (
        <Modal
          isOpen={uploadReportModalOpen}
          onClose={() => setUploadReportModalOpen(false)}
          title="Upload Diagnostic Report"
          subtitle="Manually upload authentic laboratory or radiology test documents"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUploadReportSubmit} className="space-y-3.5 text-xs">
            <Input
              label="Report / Test Title *"
              required
              placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray"
              value={uploadForm.reportName}
              onChange={(e) => setUploadForm({ ...uploadForm, reportName: e.target.value })}
            />

            <Select
              label="Diagnostic Department / Test Category"
              options={[
                'Hematology',
                'Biochemistry',
                'Radiology & Imaging',
                'Clinical Pathology',
                'Cardiology Diagnostics',
                'Microbiology',
                'Other Diagnostics',
              ]}
              value={uploadForm.testType}
              onChange={(e) => setUploadForm({ ...uploadForm, testType: e.target.value })}
            />

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Report File (PDF / Image) *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadForm({
                      ...uploadForm,
                      fileName: f.name,
                      reportName: uploadForm.reportName || f.name.replace(/\.[^/.]+$/, ''),
                    });
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-950 dark:file:text-teal-300 cursor-pointer"
              />
            </div>

            <Input
              label="File Name Reference"
              placeholder="e.g. CBC.pdf or X-Ray.jpg"
              value={uploadForm.fileName}
              onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
            />

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinical Findings / Observations (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Key biological values, impressions or normal reference status..."
                value={uploadForm.findings}
                onChange={(e) => setUploadForm({ ...uploadForm, findings: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setUploadReportModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={Upload}>
                Upload Report
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bed Reservation Modal */}
      {bedReserveModalOpen && (
        <Modal
          isOpen={bedReserveModalOpen}
          onClose={() => setBedReserveModalOpen(false)}
          title={isEmergencyBedReq ? '🚨 Emergency Bed Request' : 'Reserve Inpatient Bed'}
          subtitle={
            isEmergencyBedReq
              ? 'Urgent triage bed allocation request for acute patient condition'
              : 'Advance bed reservation request at hospital facility'
          }
          maxWidth="max-w-md"
        >
          <form onSubmit={handleBedReserveSubmit} className="space-y-3.5 text-xs">
            {isEmergencyBedReq && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Emergency Bed Request: Urgent Admission Required</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Patient requires urgent admission. Emergency staff and triage units will be notified immediately for rapid approval.
                </p>
              </div>
            )}

            <Select
              label="Selected Hospital Facility"
              options={hospitals.map((h) => ({ value: h.id, label: `${h.name} (${h.location})` }))}
              value={selectedBedHospitalId}
              onChange={(e) => setSelectedBedHospitalId(e.target.value)}
            />

            <Select
              label="Required Bed Type / Ward *"
              options={[
                { value: 'ICU', label: `ICU (Ventilator / Critical Care) — ${icuAvailableCount} available` },
                { value: 'Emergency', label: `Emergency Ward — ${emergencyAvailableCount} available` },
                { value: 'General', label: `General Ward — ${generalAvailableCount} available` },
                { value: 'Private', label: `Private Room — ${privateAvailableCount} available` },
                { value: 'Pediatric', label: `Pediatric Ward — ${pediatricAvailableCount} available` },
                { value: 'Isolation', label: 'Isolation Ward' },
              ]}
              value={bedReserveForm.ward}
              onChange={(e) => setBedReserveForm({ ...bedReserveForm, ward: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Patient Name"
                disabled
                value={currentUser?.name || myRecord?.name || 'Patient'}
              />
              <Input
                label="Contact Number"
                disabled
                value={currentUser?.mobile || myRecord?.mobile || '9876543210'}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isEmergencyBedReq ? 'Emergency Reason / Acute Symptoms *' : 'Admission Reason / Clinical Notes *'}
              </label>
              <textarea
                rows={3}
                required
                placeholder={isEmergencyBedReq ? 'e.g. Severe acute chest pain, breathless, oxygen drop...' : 'e.g. Scheduled surgery prep, doctor recommended observation...'}
                value={bedReserveForm.reason}
                onChange={(e) => setBedReserveForm({ ...bedReserveForm, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setBedReserveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className={isEmergencyBedReq ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                icon={isEmergencyBedReq ? AlertTriangle : BedDouble}
              >
                {isEmergencyBedReq ? 'Request Emergency Bed' : 'Request Reservation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency Ambulance Request Modal */}
      {ambModalOpen && (
        <Modal
          isOpen={ambModalOpen}
          onClose={() => setAmbModalOpen(false)}
          title="🚨 Request Emergency Ambulance"
          subtitle="Direct high-priority dispatch with live GPS telemetry and hospital handover"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAmbulanceSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Immediate Emergency Dispatch</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Emergency units are on standby 24/7. Keep your mobile nearby. Driver and paramedic crew will acknowledge call immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Patient Name"
                disabled
                value={currentUser?.name || myRecord?.name || 'Patient'}
              />
              <Input
                label="Contact Mobile"
                disabled
                value={currentUser?.mobile || myRecord?.mobile || '9876543210'}
              />
            </div>

            <Input
              label="Current Location / Pickup Address *"
              required
              placeholder="e.g. 14, 2nd Cross, Indiranagar, Bengaluru"
              value={ambForm.pickupLocation}
              onChange={(e) => setAmbForm({ ...ambForm, pickupLocation: e.target.value })}
            />

            <Select
              label="Emergency Condition Type *"
              options={[
                'Medical Emergency',
                'Accident',
                'Chest Pain',
                'Breathing Difficulty',
                'Injury',
                'Unconscious Patient',
                'Other Emergency',
              ]}
              value={ambForm.emergencyType}
              onChange={(e) => setAmbForm({ ...ambForm, emergencyType: e.target.value })}
            />

            <Select
              label="Destination Hospital Facility *"
              options={hospitals.map((h) => ({ value: h.id, label: `${h.name} (${h.location})` }))}
              value={ambForm.destinationHospitalId}
              onChange={(e) => setAmbForm({ ...ambForm, destinationHospitalId: e.target.value })}
            />

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Additional Notes / Landmark (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Near Metro Pillar 124, 2nd floor with lift access..."
                value={ambForm.notes}
                onChange={(e) => setAmbForm({ ...ambForm, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setAmbModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold" icon={Ambulance}>
                Request Ambulance
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Online UPI QR Payment Modal */}
      <PaymentQRModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultPatientId={myRecord?.id || currentUser?.id || ''}
        defaultPatientName={myRecord?.name || currentUser?.name || 'Patient'}
        defaultAmount={500}
        defaultCategory="OPD Consultation"
      />

      {/* Patient Face Biometric Modal */}
      <BiometricFaceLoginModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        initialRole="PATIENT"
      />
    </>
  );

  return (
    <div className="space-y-6"
>
      {renderModals()}

      {/* Patient Welcome & Live Token Card */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-teal-600/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Unified Patient Health Record</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {myRecord?.name || currentUser?.name || 'Patient'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-md">
              UHID: <span className="font-mono font-bold text-white">{myRecord?.uhid || 'UHID-2026-4402'}</span> • Facility: {hospital?.name}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                onClick={() => setBookModalOpen(true)}
              >
                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                Book Consultation
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                onClick={() => setPortalTab('beds')}
              >
                <BedDouble className="w-3.5 h-3.5 mr-1.5" />
                Check Bed Availability
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold border-transparent shadow-sm"
                onClick={() => setAmbModalOpen(true)}
              >
                <Ambulance className="w-3.5 h-3.5 mr-1.5" />
                Emergency Ambulance
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-emerald-500/25 hover:bg-emerald-500/35 text-white border border-emerald-400/40"
                onClick={() => setPaymentModalOpen(true)}
              >
                <QrCode className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                Pay via UPI QR
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                onClick={() => setFaceModalOpen(true)}
              >
                <ScanFace className="w-3.5 h-3.5 mr-1.5 text-teal-300" />
                Face ID Biometric
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                onClick={() => setFeedbackModalOpen(true)}
              >
                <Star className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                Rate Experience
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                onClick={() => setTicketModalOpen(true)}
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-teal-200" />
                Need Help?
              </Button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center sm:text-right shrink-0">
            <span className="text-[11px] uppercase tracking-widest text-teal-200 block font-semibold">
              Live OPD Token
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block my-1">
              {myRecord?.token || 'WALK-IN'}
            </span>
            <div className="flex flex-col sm:items-end gap-1">
              <Badge variant="teal" size="sm" className="bg-white/20 text-white">
                Queue Position #{myRecord?.queuePosition || 1}
              </Badge>
              <span className="text-[11px] font-medium text-teal-200 flex items-center justify-center sm:justify-end gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                Est. Wait: {calculateQueueEta(myRecord?.queuePosition, myRecord?.priority)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 overflow-x-auto">
        {[
          { key: 'journey', label: 'OPD Live & Journey', icon: Activity },
          { key: 'reports', label: `Diagnostic Reports (${diagnosticReports.length})`, icon: FileText },
          { key: 'beds', label: `Check Beds (${availableBedsCount} open)`, icon: BedDouble },
          { key: 'ambulance', label: 'Emergency Ambulance', icon: Ambulance },
          { key: 'prescriptions', label: `Prescriptions (${myRecord?.prescriptions?.length || 0})`, icon: Pill },
          { key: 'discharge', label: 'Discharge Summary & Bills (PDF)', icon: FileSpreadsheet },
          { key: 'history', label: 'Medical Profile & UHID', icon: Heart },
          { key: 'support', label: `Help & Support (${displayTickets.length})`, icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setPortalTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                portalTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPD LIVE & JOURNEY */}
      {portalTab === 'journey' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Consulting Specialist" subtitle="Assigned outpatient physician">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{myRecord?.doctor || 'Dr. Priya Nair'}</p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{myRecord?.department || 'General Medicine'}</p>
                </div>
              </div>
            </Card>

            <Card title="Facility Details" subtitle="Campus location">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{hospital?.name}</p>
                  <p className="text-xs text-slate-400 font-mono">OPD Room 104 • Ground Floor</p>
                </div>
              </div>
            </Card>

            <Card title="Appointment Status" subtitle="Live tracking">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{myRecord?.status || 'Active'}</p>
                  <p className="text-xs text-slate-400 font-mono">Arrived: {formatTime(myRecord?.registeredAt)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Animated Vitals + Care Journey Slideshow */}
          {/* Animated health awareness videos for the waiting area */}
          <HealthVideoBanner />
          {/* Cartoon care companion - patient-facing illustration band */}
          <CartoonHero />
          <PatientVitalsPanel />

          <DoctorAvailability />
          <MotionStrip variant="patient" />

          <AuthSlideshow />

          {/* Scheduled Bookings */}
          <Card
            title="Upcoming Scheduled Appointments"
            subtitle="Booked specialist consultations across the Arogya network"
            headerAction={
              <Button variant="primary" size="sm" onClick={() => setBookModalOpen(true)}>
                <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Book New
              </Button>
            }
          >
            <div className="space-y-3 text-xs">
              {displayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{apt.doctor}</span>
                        <Badge
                          variant={
                            apt.status === 'Confirmed'
                              ? 'teal'
                              : apt.status === 'Checked In'
                              ? 'blue'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {apt.department} • <span className="font-semibold text-slate-700 dark:text-slate-300">{apt.date} at {apt.timeSlot}</span>
                      </p>
                      {apt.symptoms && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">Reason: {apt.symptoms}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {apt.status === 'Confirmed' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => checkInAppointment(apt.id)}
                        >
                          Check In & Get Token
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelAppointment(apt.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {apt.status === 'Checked In' && (
                      <Badge variant="emerald" size="sm">
                        In Live Queue
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Journey Timeline & AI Health Guidance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="My Care Journey Timeline" subtitle="Live updates as you progress through consultations and labs">
              <PatientJourneyTimeline journey={myRecord?.journey} currentStatus={myRecord?.status} />
            </Card>

            <Card title="AI Health Guidance" subtitle="Operational patient guidance">
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Preparation for Consultation</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Please remain seated in the OPD Waiting Lounge near Room 104. When your token is called by Dr. {myRecord?.doctor || 'the specialist'}, proceed inside. Keep any prior lab investigation slips and prescription history ready.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-100 dark:border-teal-900/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Vitals BP</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{myRecord?.vitals?.bp || '120/80 mmHg'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">SpO2 Oxygen</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{myRecord?.vitals?.spo2 || '98%'}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-teal-100 dark:border-teal-900/60 pt-1.5">
                  AI operational guidance • Not a substitute for professional medical advice.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC LAB REPORTS */}
      {portalTab === 'reports' && (
        <Card
          title="Diagnostic Lab & Imaging Reports"
          subtitle="Hematology, Biochemistry, Radiology & Cardiac reports with verified biological ranges"
          headerAction={
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              onClick={() => setUploadReportModalOpen(true)}
            >
              Upload Report
            </Button>
          }
        >
          {diagnosticReports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No reports uploaded yet.</p>
                <p className="text-xs text-slate-400 mt-0.5">Upload a diagnostic test or radiology report to securely access it here.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => setUploadReportModalOpen(true)}
              >
                Upload Report
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {diagnosticReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{rep.testName}</span>
                        <Badge variant={rep.status === 'Available' ? 'teal' : 'amber'} size="sm">
                          {rep.status}
                        </Badge>
                        {rep.fileName && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {rep.fileName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rep.department} • Ordered by <span className="font-medium text-slate-700 dark:text-slate-300">{rep.orderedBy}</span> • Date: {rep.date}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        ✓ {rep.normalRange}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedReportModal(rep)}
                    >
                      View Report
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Download}
                      onClick={() => handleDownloadReport(rep)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: CHECK BED AVAILABILITY & RESERVATION */}
      {portalTab === 'beds' && (
        <div className="space-y-6">
          <Card
            title="Check Hospital Bed Availability"
            subtitle="Real-time bed telemetry and emergency inpatient bed reservations"
            headerAction={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={BedDouble}
                  onClick={() => {
                    setIsEmergencyBedReq(false);
                    setBedReserveModalOpen(true);
                  }}
                >
                  Reserve Bed
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  icon={AlertTriangle}
                  onClick={() => {
                    setIsEmergencyBedReq(true);
                    setBedReserveModalOpen(true);
                  }}
                >
                  Emergency Bed Request
                </Button>
              </div>
            }
          >
            {/* Bed Type Filter Strip */}
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Filter by Bed Type:
              </span>
              {['All', 'ICU', 'Emergency', 'General', 'Private', 'Pediatric', 'Isolation'].map((ward) => (
                <button
                  key={ward}
                  type="button"
                  onClick={() => setBedTypeFilter(ward)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    bedTypeFilter === ward
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500'
                  }`}
                >
                  {ward}
                </button>
              ))}
            </div>

            {/* Multi-Hospital Bed Availability Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {hospitals.map((hosp) => {
                const hospBeds = beds.filter((b) => b.hospitalId === hosp.id);
                const totalAvail = hospBeds.filter((b) => b.status === 'Available').length;
                const icuAvail = hospBeds.filter((b) => b.ward === 'ICU' && b.status === 'Available').length;
                const emgAvail = hospBeds.filter((b) => b.ward === 'Emergency' && b.status === 'Available').length;
                const genAvail = hospBeds.filter((b) => b.ward === 'General' && b.status === 'Available').length;
                const prvAvail = hospBeds.filter((b) => b.ward === 'Private' && b.status === 'Available').length;
                const pedAvail = hospBeds.filter((b) => b.ward === 'Pediatric' && b.status === 'Available').length;
                const isoAvail = hospBeds.filter((b) => b.ward === 'Isolation' && b.status === 'Available').length;

                // Check if hospital supports the filtered ward
                const hasWardBeds = bedTypeFilter === 'All' || hospBeds.some((b) => b.ward === bedTypeFilter);
                if (!hasWardBeds) return null;

                return (
                  <div
                    key={hosp.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            {hosp.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {hosp.location}
                          </p>
                        </div>
                        <Badge
                          variant={
                            hosp.status === 'Critical' ? 'danger' :
                            hosp.status === 'Busy' ? 'warning' : 'teal'
                          }
                          size="sm"
                        >
                          {hosp.status || 'Normal'}
                        </Badge>
                      </div>

                      {/* Availability Breakdown */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Available Beds:</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                            {totalAvail} Available
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className={`p-2 rounded-xl border ${
                            bedTypeFilter === 'ICU'
                              ? 'bg-rose-100 dark:bg-rose-950 border-rose-400 font-bold'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50'
                          }`}>
                            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">ICU Available</span>
                            <span className="text-base font-black text-rose-600 dark:text-rose-400">{icuAvail}</span>
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            bedTypeFilter === 'Emergency'
                              ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 font-bold'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50'
                          }`}>
                            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Emergency Beds</span>
                            <span className="text-base font-black text-amber-600 dark:text-amber-400">{emgAvail}</span>
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            bedTypeFilter === 'General'
                              ? 'bg-sky-100 dark:bg-sky-950 border-sky-400 font-bold'
                              : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-900/50'
                          }`}>
                            <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300 block">General Beds</span>
                            <span className="text-base font-black text-sky-600 dark:text-sky-400">{genAvail}</span>
                          </div>
                        </div>

                        {(prvAvail > 0 || pedAvail > 0 || isoAvail > 0) && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {prvAvail > 0 && <span>Private: <strong className="text-slate-700 dark:text-slate-200 font-mono">{prvAvail}</strong></span>}
                            {pedAvail > 0 && <span>Pediatric: <strong className="text-slate-700 dark:text-slate-200 font-mono">{pedAvail}</strong></span>}
                            {isoAvail > 0 && <span>Isolation: <strong className="text-slate-700 dark:text-slate-200 font-mono">{isoAvail}</strong></span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs cursor-pointer"
                        onClick={() => setViewBedsHospitalId(hosp.id)}
                      >
                        View Beds
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs cursor-pointer shadow-sm shadow-teal-500/20"
                        disabled={totalAvail === 0}
                        onClick={() => {
                          setSelectedBedHospitalId(hosp.id);
                          if (bedTypeFilter !== 'All') {
                            setBedReserveForm((prev) => ({ ...prev, ward: bedTypeFilter }));
                          }
                          setIsEmergencyBedReq(false);
                          setBedReserveModalOpen(true);
                        }}
                      >
                        Reserve Bed
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Bed Matrix Modal for View Beds */}
            {viewBedsHospitalId && (
              <Modal
                isOpen={!!viewBedsHospitalId}
                onClose={() => setViewBedsHospitalId(null)}
                title={`Bed Matrix — ${hospitals.find((h) => h.id === viewBedsHospitalId)?.name || 'Hospital'}`}
                subtitle="Real-time inpatient bed status and telemetry from Hospital Operating System"
                maxWidth="max-w-2xl"
              >
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1">
                    {beds
                      .filter((b) => b.hospitalId === viewBedsHospitalId)
                      .filter((b) => bedTypeFilter === 'All' || b.ward === bedTypeFilter)
                      .map((b) => (
                        <div
                          key={b.id}
                          className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                            b.status === 'Available'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                              : b.status === 'Occupied'
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-black text-sm block">{b.bedNumber}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{b.ward} Ward</span>
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">{b.bedType}</span>
                          </div>
                          <div className="mt-2">
                            <Badge
                              variant={
                                b.status === 'Available' ? 'success' :
                                b.status === 'Occupied' ? 'danger' : 'warning'
                              }
                              size="sm"
                            >
                              {b.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" size="sm" onClick={() => setViewBedsHospitalId(null)}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedBedHospitalId(viewBedsHospitalId);
                        if (bedTypeFilter !== 'All') {
                          setBedReserveForm((prev) => ({ ...prev, ward: bedTypeFilter }));
                        }
                        setViewBedsHospitalId(null);
                        setIsEmergencyBedReq(false);
                        setBedReserveModalOpen(true);
                      }}
                    >
                      Reserve Bed at this Hospital
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </Card>

          {/* Active Bed Reservations for this Patient */}
          <Card
            title="My Bed Reservation Requests"
            subtitle="Track status of requested and approved inpatient reservations"
            noPadding
          >
            {myReservations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <BedDouble className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p>No bed reservations requested yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Reservation ID</th>
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3">Ward & Type</th>
                      <th className="px-4 py-3">Urgency</th>
                      <th className="px-4 py-3">Requested At</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned Bed</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {res.id}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {res.hospitalName}
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          {res.ward} Ward
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={res.isEmergency ? 'danger' : 'default'} size="sm">
                            {res.isEmergency ? '🚨 Emergency' : 'Standard'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(res.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              res.status === 'Reserved'
                                ? 'success'
                                : res.status === 'Pending'
                                ? 'warning'
                                : res.status === 'Admitted'
                                ? 'teal'
                                : 'default'
                            }
                            size="sm"
                          >
                            {res.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          {res.bedNumber ? (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              Bed #{res.bedNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending Approval</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {(res.status === 'Pending' || res.status === 'Reserved') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                              onClick={() => cancelBedReservation(res.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: EMERGENCY AMBULANCE */}
      {portalTab === 'ambulance' && (
        <div className="space-y-6">
          <Card
            title="Emergency Ambulance Dispatch & Live Telemetry"
            subtitle="Direct high-priority ambulance booking and real-time response tracking"
            headerAction={
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                icon={Ambulance}
                onClick={() => setAmbModalOpen(true)}
              >
                Request Ambulance
              </Button>
            }
          >
            {/* Active Ambulance Tracking Card if request exists */}
            {activeAmbulanceRequest ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-500/40 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-rose-600 text-white">
                      <Ambulance className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          {activeAmbulanceRequest.requestId}
                        </span>
                        <Badge variant="danger" size="sm">
                          {activeAmbulanceRequest.emergencyType}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Destination: <strong>{activeAmbulanceRequest.destination}</strong> • Pickup: {activeAmbulanceRequest.pickupLocation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Mission Status</span>
                      <Badge
                        variant={activeAmbulanceRequest.status === 'Accepted' || activeAmbulanceRequest.status === 'Driver En Route' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {activeAmbulanceRequest.status}
                      </Badge>
                    </div>
                    {activeAmbulanceRequest.status === 'Pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => cancelAmbulanceRequest(activeAmbulanceRequest.requestId)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Progression Stepper */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Dispatch Progression Timeline
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                    {[
                      { step: 'Pending', label: 'Requested' },
                      { step: 'Accepted', label: 'Accepted' },
                      { step: 'Driver En Route', label: 'Driver En Route' },
                      { step: 'Arrived at Pickup', label: 'At Pickup' },
                      { step: 'Patient Picked Up', label: 'Picked Up' },
                      { step: 'En Route to Hospital', label: 'En Route to Hosp' },
                      { step: 'Arrived at Hospital', label: 'At Hospital' },
                    ].map((st, i) => {
                      const stages = [
                        'Pending',
                        'Accepted',
                        'Driver En Route',
                        'Arrived at Pickup',
                        'Patient Picked Up',
                        'En Route to Hospital',
                        'Arrived at Hospital',
                        'Completed',
                      ];
                      const currentIndex = stages.indexOf(activeAmbulanceRequest.status);
                      const isCurrent = activeAmbulanceRequest.status === st.step;
                      const isPast = currentIndex >= stages.indexOf(st.step);

                      return (
                        <div
                          key={st.step}
                          className={`p-2 rounded-xl border text-[11px] transition-all ${
                            isCurrent
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 font-bold text-rose-700 dark:text-rose-300 shadow-xs'
                              : isPast
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-semibold text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="block text-[10px] text-slate-400">Step {i + 1}</span>
                          <span>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Driver & Vehicle Telemetry (when accepted) */}
                {activeAmbulanceRequest.ambulanceCode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">AMBULANCE UNIT</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {activeAmbulanceRequest.ambulanceCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DRIVER ON DUTY</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {activeAmbulanceRequest.driverName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DRIVER CONTACT</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {activeAmbulanceRequest.driverContact}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ESTIMATED TIME TO ARRIVAL</span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                        {activeAmbulanceRequest.eta}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Ambulance Request is broadcasted to city fleet. Waiting for available driver to accept.</span>
                  </div>
                )}

                {/* Live GPS Map preview */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Live GPS Vehicle Corridor Map
                  </span>
                  <InteractiveMap hospitals={hospitals} ambulances={ambulances} />
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 space-y-3">
                <Ambulance className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Ambulance Request</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    In case of a medical emergency, click below to request immediate cardiac/trauma ambulance dispatch to your location.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  icon={Ambulance}
                  onClick={() => setAmbModalOpen(true)}
                >
                  Request Emergency Ambulance
                </Button>
              </div>
            )}
          </Card>

          {/* Past Ambulance Request History */}
          {myAmbulanceRequests.length > 0 && (
            <Card title="Ambulance Dispatch History" subtitle="Previous emergency dispatches" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Request ID</th>
                      <th className="px-4 py-3">Emergency Type</th>
                      <th className="px-4 py-3">Pickup Location</th>
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myAmbulanceRequests.map((req) => (
                      <tr key={req.requestId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {req.requestId}
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          {req.emergencyType}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {req.pickupLocation}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {req.destination}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {req.ambulanceCode || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              req.status === 'Completed'
                                ? 'success'
                                : req.status === 'Cancelled'
                                ? 'default'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: PRESCRIPTIONS */}
      {portalTab === 'prescriptions' && (
        <Card
          title="Digital Prescription Summary"
          subtitle="Directly synchronized with Hospital Pharmacy counters for immediate dispensation"
        >
          {(!myRecord?.prescriptions || myRecord.prescriptions.length === 0) ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Pill className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No digital prescriptions issued yet during this visit.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {myRecord.prescriptions.map((rx, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{rx.medicine}</span>
                        <Badge variant="teal" size="sm">
                          Active Course
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{rx.dosage}</span> • Frequency: <span className="font-medium text-slate-800 dark:text-slate-200">{rx.frequency}</span> • Course: <span className="font-medium text-slate-800 dark:text-slate-200">{rx.duration}</span>
                      </p>
                      {rx.instructions && (
                        <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                          Instructions: {rx.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge variant="blue" size="sm">
                      Dispensed / Counter Ready
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: MEDICAL HISTORY & UHID */}
      {portalTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Patient Health Profile" subtitle="Official demographics and clinical markers">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Permanent UHID:</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{myRecord?.uhid || 'UHID-2026-4402'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Blood Group:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{myRecord?.bloodGroup || 'O+ Positive'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Age / Gender:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{myRecord?.age || 36} Years • {myRecord?.gender || 'Male'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Emergency Contact:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{myRecord?.emergencyContact || '+91 98451 99887 (Spouse)'}</span>
                </div>
              </div>
            </Card>

            <Card title="Allergies & Chronic Conditions" subtitle="Recorded hypersensitivities and previous diagnoses">
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Known Drug / Food Allergies:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    {myRecord?.allergies || 'Penicillin hypersensitivity (mild urticaria noted in 2023). No known food or latex allergies.'}
                  </p>
                </div>

              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: DISCHARGE SUMMARY & HOSPITAL DISCHARGE BILL (PDF) */}
      {portalTab === 'discharge' && (() => {
        const myDischarge = discharges.find(
          (d) => d.patientId === myRecord?.id || d.patientId === currentUser?.id
        ) || {
          id: `DIS-${myRecord?.token || '2026-904'}`,
          admissionId: `ADM-2026-${myRecord?.token?.replace(/[^0-9]/g, '') || '402'}`,
          admissionDate: '2026-09-21',
          dischargeDate: new Date().toISOString().split('T')[0],
          diagnosis: myRecord?.symptoms ? `Acute presentation of ${myRecord.symptoms} — Treated & Resolved` : 'Acute Febrile Illness & Mild Bronchitis — Resolved',
          treatmentSummary: 'Patient admitted for acute clinical management and symptom relief. Monitored in Inpatient Medical Ward. Responded favorably to intravenous antimicrobial protocol, antipyretics, and fluid resuscitation. Vital parameters normalized, afebrile for past 48 hours.',
          conditionOnDischarge: 'Clinically Stable, Afebrile, Ambulatory with good oral intake',
          medicationsAdvised: (myRecord?.prescriptions && myRecord.prescriptions.length > 0)
            ? myRecord.prescriptions.map((rx) => `- Tab. ${rx.medicine} (${rx.dosage}, ${rx.frequency}) for ${rx.duration}`).join('\n')
            : '- Tab. Paracetamol 650mg SOS after meals\n- Tab. Pantoprazole 40mg OD AC (5 days)\n- Tab. Vitamin C 500mg OD (10 days)',
          dietAdvice: 'Soft bland diet, maintain 2.5L daily hydration, avoid strenuous physical exertion for 5 days.',
          followUpDate: '2026-10-02',
          consultant: myRecord?.doctor || 'Dr. Priya Nair, MD (Internal Medicine)',
          medicalSuperintendent: 'Dr. Ramesh Babu, Medical Director',
        };

        const myPayment = payments.find(
          (p) => p.patientId === myRecord?.id || p.patientId === currentUser?.id
        ) || {
          billNumber: `BILL-DIS-${myRecord?.token || '402'}`,
          createdAt: new Date().toISOString(),
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'UPI',
          transactionId: `UPI-NPCI-9844201994-${myRecord?.token || '402'}`,
          consultationFee: 500,
          labFee: 1200,
          medicineFee: 850,
          bedCharges: 1500,
          otherCharges: 0,
          totalAmount: 4050,
          status: 'PAID',
        };

        return (
          <div className="space-y-6">
            {/* Header Compliance Alert Banner */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-teal-950 dark:text-teal-100 flex items-center gap-2">
                    <span>Certified Hospital PDF Documents</span>
                    <Badge variant="teal" size="sm">ISO-32000 Vector PDF</Badge>
                  </h3>
                  <p className="text-xs text-teal-800 dark:text-teal-300 mt-0.5 max-w-2xl leading-relaxed">
                    All discharge summaries and final hospital bills are generated in official unalterable vector PDF format with SHA-256 digital stamps. They cannot be modified in Notepad or text editors.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDischargeSummary(myDischarge, myRecord || currentUser, hospital)}
                  icon={Download}
                >
                  Discharge Summary PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPaymentReceipt(myPayment, myRecord || currentUser, hospital)}
                  icon={Printer}
                >
                  Discharge Bill PDF
                </Button>
              </div>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* CARD 1: INPATIENT DISCHARGE SUMMARY */}
              <Card
                title="Official Hospital Discharge Summary"
                subtitle="Clinical trajectory, inpatient course, and discharge orders"
                headerAction={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => downloadDischargeSummary(myDischarge, myRecord || currentUser, hospital)}
                  >
                    Download PDF
                  </Button>
                }
              >
                <div className="space-y-4 text-xs">
                  {/* Metadata Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Admission ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{myDischarge.admissionId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Admission Date</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{myDischarge.admissionDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Discharge Date</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{myDischarge.dischargeDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Attending Physician</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{myDischarge.consultant}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Condition at Discharge</span>
                      <Badge variant="success" size="sm">{myDischarge.conditionOnDischarge}</Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Follow-Up Review</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{myDischarge.followUpDate}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-1">
                      Final Clinical Diagnosis
                    </span>
                    <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 text-teal-950 dark:text-teal-200 font-semibold leading-relaxed">
                      {myDischarge.diagnosis}
                    </div>
                  </div>

                  {/* Treatment Summary */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-1">
                      Inpatient Course & Treatment Provided
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      {myDischarge.treatmentSummary}
                    </p>
                  </div>

                  {/* Medications Advised */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-1">
                      Medications Prescribed on Discharge
                    </span>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-line">
                      {myDischarge.medicationsAdvised}
                    </div>
                  </div>

                  {/* Download PDF Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Digitally Certified by Hospital Medical Board
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Download}
                      onClick={() => downloadDischargeSummary(myDischarge, myRecord || currentUser, hospital)}
                    >
                      Download Discharge PDF
                    </Button>
                  </div>
                </div>
              </Card>

              {/* CARD 2: HOSPITAL DISCHARGE BILL & UPI TERMINAL */}
              <div className="space-y-6">
                <Card
                  title="Official Hospital Discharge Bill & Receipt"
                  subtitle="Itemized medical charges, insurance clearance & payment receipt"
                  headerAction={
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Printer}
                      onClick={() => downloadPaymentReceipt(myPayment, myRecord || currentUser, hospital)}
                    >
                      Download Bill PDF
                    </Button>
                  }
                >
                  <div className="space-y-4 text-xs">
                    {/* Bill Header Info */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Invoice Number</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{myPayment.billNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Payment Status</span>
                        <Badge variant="success" size="sm" dot>
                          PAID IN FULL (UPI)
                        </Badge>
                      </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                          <tr>
                            <th className="px-3 py-2.5">Billing Item / Service</th>
                            <th className="px-3 py-2.5 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">Specialist OPD & Doctor Care</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">₹{myPayment.consultationFee?.toFixed(2) || '500.00'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">Clinical Laboratory Diagnostics</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">₹{myPayment.labFee?.toFixed(2) || '1200.00'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">Inpatient Pharmacy & Medications</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">₹{myPayment.medicineFee?.toFixed(2) || '850.00'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">Inpatient Ward Bed & Nursing</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">₹{myPayment.bedCharges?.toFixed(2) || '1500.00'}</td>
                          </tr>
                          <tr className="bg-teal-50/50 dark:bg-teal-950/20 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                            <td className="px-3 py-2.5 text-teal-900 dark:text-teal-200 font-extrabold text-sm">Net Hospital Total</td>
                            <td className="px-3 py-2.5 text-right font-mono text-teal-700 dark:text-teal-300 font-black text-sm">
                              ₹{myPayment.totalAmount?.toFixed(2) || '4050.00'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                      <div><strong>Transaction ID:</strong> <span className="font-mono text-slate-700 dark:text-slate-300">{myPayment.transactionId}</span></div>
                      <div><strong>Payment Mode:</strong> UPI Fast Gateway (RuPay / BHIM / GPay)</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={QrCode}
                        onClick={() => setPaymentModalOpen(true)}
                      >
                        UPI Payment Terminal
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Printer}
                        onClick={() => downloadPaymentReceipt(myPayment, myRecord || currentUser, hospital)}
                      >
                        Download Bill PDF
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Instant UPI Payment Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between gap-4 shadow-lg border border-teal-700/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 bg-white p-1 rounded-xl shrink-0 shadow">
                      <img src="/payment-qr.png" alt="Arogya UPI QR" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Instant UPI Settlement</h4>
                      <p className="text-[11px] text-teal-200 mt-0.5">UPI ID: arogyaqueue@upi • Zero Fee</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white text-teal-900 hover:bg-teal-50 font-bold shrink-0"
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    Open QR Terminal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: HELP & SUPPORT */}
      {portalTab === 'support' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Emergency Hotline" subtitle="24/7 Ambulance Dispatch">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono font-black text-rose-600 text-base">108 / +91 80 2200 9999</p>
                  <p className="text-[11px] text-slate-400">City Emergency Control</p>
                </div>
              </div>
            </Card>

            <Card title="Patient Help Desk" subtitle="Token & Reception Support">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Ext. 101 / 102</p>
                  <p className="text-[11px] text-slate-400">OPD Ground Floor Desk</p>
                </div>
              </div>
            </Card>

            <Card title="Billing & Insurance" subtitle="TPA & Ayushman Desk">
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Room 204 (1st Floor)</p>
                  <p className="text-[11px] text-slate-400">Desk Officer: Kavita M.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Support Tickets Raised */}
          <Card
            title="My Support & Grievance Tickets"
            subtitle="Real-time issue tracking with administrative response records"
            headerAction={
              <Button variant="primary" size="sm" onClick={() => setTicketModalOpen(true)}>
                <Send className="w-3.5 h-3.5 mr-1" /> Raise New Ticket
              </Button>
            }
          >
            {displayTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No support tickets currently open for your account.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {displayTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{t.id}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{t.subject}</span>
                        <Badge
                          variant={t.status === 'Open' ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Category: <span className="font-medium text-slate-700 dark:text-slate-300">{t.category}</span> • Created: {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                      {t.message && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                          "{t.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Badge variant="slate" size="sm">
                        Under Review
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
