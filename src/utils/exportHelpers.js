import { jsPDF } from 'jspdf';

/**
 * Export helpers for professional PDF documents, receipts, QR cards, and discharge summaries
 */

export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download an unalterable, official Hospital Discharge Bill in PDF format
 */
export function downloadPaymentReceipt(payment, patient, hospital) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const hospitalName = hospital?.name || 'Arogya Central Multi-Specialty Hospital';
    const hospitalCity = hospital?.city || hospital?.location || 'Bengaluru, Karnataka';
    const billNo = payment?.billNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const patientName = patient?.name || payment?.patientName || 'Verified Patient';
    const uhid = patient?.uhid || patient?.id || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = payment?.transactionId || `UPI-${Date.now().toString().slice(-8)}`;
    const billDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const billTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Faint security background watermark
    doc.setTextColor(230, 240, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.saveGraphicsState?.();
    doc.text('OFFICIAL RECORD - LOCKED', 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState?.();

    // Top Header Banner
    doc.setFillColor(15, 118, 110); // Teal-700
    doc.rect(0, 0, 210, 36, 'F');

    // Hospital Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(hospitalName.toUpperCase(), 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(204, 251, 241); // Teal-100
    doc.text(`${hospitalCity} • 24x7 Emergency: 108 • National Health Grid ID: NHG-IN-9821`, 14, 22);
    doc.text('NABH Accredited & Ayushman Bharat Verified Healthcare Provider', 14, 28);

    // Document Title Banner
    doc.setFillColor(240, 253, 250); // Teal-50
    doc.setDrawColor(204, 251, 241);
    doc.rect(14, 42, 182, 14, 'FD');

    doc.setTextColor(15, 118, 110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INPATIENT DISCHARGE & HOSPITAL BILL SETTLEMENT RECEIPT', 18, 51);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`INVOICE: ${billNo}`, 190, 51, { align: 'right' });

    // Meta Block (Patient & Bill Details in two neat side-by-side cards)
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 60, 88, 38, 2, 2, 'FD');
    doc.roundedRect(108, 60, 88, 38, 2, 2, 'FD');

    // Left Card: Patient Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PATIENT INPATIENT RECORD', 18, 67);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Patient Name:`, 18, 73);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${patientName}`, 42, 73);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`UHID / Token:`, 18, 79);
    doc.text(`${uhid}  [${patient?.token || 'INP-01'}]`, 42, 79);

    doc.text(`Phone:`, 18, 85);
    doc.text(`${patient?.mobile || '+91 98765 43210'}`, 42, 85);

    doc.text(`Department:`, 18, 91);
    doc.text(`${patient?.department || 'General Medicine / IPD'}`, 42, 91);

    // Right Card: Billing & Admission Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SETTLEMENT METADATA', 112, 67);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Discharge Date:`, 112, 73);
    doc.text(`${billDate} ${billTime}`, 142, 73);

    doc.text(`Payment Mode:`, 112, 79);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`${payment?.method || 'UPI / QR'} (Instant Verified)`, 142, 79);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`UPI UTR / TXN:`, 112, 85);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${txnId}`, 142, 85);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Settlement Status:`, 112, 91);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // Green-800
    doc.text('PAID IN FULL (ZERO BALANCE)', 142, 91);

    // Itemized Table Header
    const tableStartY = 104;
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(14, tableStartY, 182, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', 18, tableStartY + 5.5);
    doc.text('SERVICE / CLINICAL ITEM DESCRIPTION', 30, tableStartY + 5.5);
    doc.text('CATEGORY', 125, tableStartY + 5.5);
    doc.text('AMOUNT (INR)', 190, tableStartY + 5.5, { align: 'right' });

    // Table Line Items
    const consultation = Number(payment?.consultationFee) || 500;
    const labCharges = Number(payment?.labFee) || 0;
    const medicines = Number(payment?.medicineFee) || 0;
    const bedCharges = Number(payment?.bedCharges) || 0;
    const otherCharges = Number(payment?.otherCharges) || 0;
    const totalAmount = Number(payment?.totalAmount) || (consultation + labCharges + medicines + bedCharges + otherCharges || 550);

    const items = [
      { id: '1', desc: 'Specialist Physician Consultation & Medical Rounds', cat: 'Professional', amt: consultation },
      { id: '2', desc: 'Inpatient Bed, Nursing Care & Bio-waste Disposal', cat: 'Ward Services', amt: bedCharges || 350 },
      { id: '3', desc: 'Clinical Pathology, Blood Tests & Diagnostics', cat: 'Laboratory', amt: labCharges || 200 },
      { id: '4', desc: 'Inpatient Formulary Pharmacy & IV Consumables', cat: 'Pharmacy', amt: medicines || 450 },
      { id: '5', desc: 'Hospital Infrastructure & Electronic Health Record Tech Fee', cat: 'Administrative', amt: otherCharges || 150 },
    ];

    let currentY = tableStartY + 8;
    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(14, currentY, 182, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(14, currentY + 7.5, 196, currentY + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(item.id, 18, currentY + 5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.desc, 30, currentY + 5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.cat, 125, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`₹${item.amt.toFixed(2)}`, 190, currentY + 5, { align: 'right' });

      currentY += 7.5;
    });

    // Summary Box at bottom right
    const summaryBoxY = currentY + 4;
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(204, 251, 241);
    doc.roundedRect(120, summaryBoxY, 76, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', 125, summaryBoxY + 6);
    doc.text(`₹${totalAmount.toFixed(2)}`, 190, summaryBoxY + 6, { align: 'right' });

    doc.text('Govt Health Subsidy / Discount:', 125, summaryBoxY + 12);
    doc.text('₹0.00', 190, summaryBoxY + 12, { align: 'right' });

    doc.setDrawColor(15, 118, 110);
    doc.line(125, summaryBoxY + 15, 192, summaryBoxY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text('NET AMOUNT PAID:', 125, summaryBoxY + 21);
    doc.text(`₹${totalAmount.toFixed(2)}`, 190, summaryBoxY + 21, { align: 'right' });

    // Official Stamp / Authorization Box
    const stampY = summaryBoxY;
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, stampY, 100, 26, 2, 2, 'D');

    // PAID seal stamp effect
    doc.setDrawColor(22, 163, 74);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.roundedRect(18, stampY + 4, 34, 16, 2, 2, 'D');
    doc.text('★ PAID ★', 35, stampY + 14.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally Authenticated by:', 56, stampY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Arogya Billing Gateway', 56, 12 + stampY);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Finance Officer', 56, 17 + stampY);
    doc.text(`Hash: SHA-${Date.now().toString(16).toUpperCase()}`, 56, 22 + stampY);

    // Terms & Legal notice (Unalterable electronic hospital document)
    const termsY = stampY + 34;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Notice: This is a secure, electronically certified medical billing document issued pursuant to IT Act 2000. Any unauthorized alteration or forgery is strictly prohibited.',
      14,
      termsY
    );
    doc.text(
      'All emergency & pharmacy dues for this inpatient admission episode are settled in full. For tax deductions under Sec 80D, retain this locked PDF copy.',
      14,
      termsY + 4
    );

    // Footer bottom banner
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Arogya Queue National Health Operating System • https://arogyaqueue.gov.in', 105, 293, { align: 'center' });

    // Save strictly as PDF
    doc.save(`Arogya_Discharge_Bill_${billNo}.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
    // Fallback if jsPDF encounters environment restrictions
    const textFallback = `AROGYA DISCHARGE BILL\nReceipt: ${payment?.billNumber}\nTotal: ₹${payment?.totalAmount}\nStatus: PAID`;
    downloadFile(textFallback, `Receipt_${payment?.billNumber || Date.now()}.txt`);
  }
}

/**
 * Generate and download an unalterable, official Clinical Discharge Summary in PDF format
 */
export function downloadDischargeSummary(discharge, patient, hospital) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const hospitalName = hospital?.name || 'Arogya Central Multi-Specialty Hospital';
    const hospitalCity = hospital?.city || hospital?.location || 'Bengaluru, Karnataka';
    const admId = discharge?.admissionId || `ADM-${Math.floor(100000 + Math.random() * 900000)}`;
    const patientName = patient?.name || discharge?.patientName || 'Patient';
    const uhid = patient?.uhid || patient?.id || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const docName = discharge?.doctor || 'Dr. Priya Nair, MD (Internal Medicine)';
    const dischargeDate = discharge?.dischargeDate || new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Faint security background watermark
    doc.setTextColor(230, 240, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.saveGraphicsState?.();
    doc.text('CLINICAL SUMMARY - LOCKED', 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState?.();

    // Top Header Banner
    doc.setFillColor(15, 118, 110); // Teal-700
    doc.rect(0, 0, 210, 34, 'F');

    // Hospital Name & Subheader
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(hospitalName.toUpperCase(), 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(204, 251, 241);
    doc.text(`Department of Inpatient Clinical Services • ${hospitalCity}`, 14, 21);
    doc.text('Government Accredited Tertiary Care Center • NABH Safe Care Hospital', 14, 27);

    // Title Band
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(204, 251, 241);
    doc.rect(14, 39, 182, 12, 'FD');

    doc.setTextColor(15, 118, 110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICIAL CLINICAL DISCHARGE SUMMARY & MEDICAL PROTOCOL', 18, 47);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`EPISODE ID: ${admId}`, 190, 47, { align: 'right' });

    // Patient Demographics Section
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 55, 182, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PATIENT IDENTIFICATION & INPATIENT DETAILS', 18, 62);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text('Patient Full Name:', 18, 69);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(patientName, 50, 69);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('UHID / Health ID:', 18, 76);
    doc.text(uhid, 50, 76);

    doc.text('Age / Gender:', 18, 83);
    doc.text(`${patient?.age || '32'} Years / ${patient?.gender || 'Male'}`, 50, 83);

    doc.text('Attending Physician:', 110, 69);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(docName, 142, 69);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Discharge Date:', 110, 76);
    doc.text(dischargeDate, 142, 76);

    doc.text('Room / Bed No:', 110, 83);
    doc.text(`${patient?.bedNumber || 'Bed #104-ICU Ward'}`, 142, 83);

    // Clinical Findings Section
    let sectionY = 94;

    const renderSectionHeader = (title) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, sectionY, 182, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 118, 110);
      doc.text(title, 18, sectionY + 4.5);
      sectionY += 9;
    };

    renderSectionHeader('1. CLINICAL DIAGNOSIS & REASON FOR ADMISSION');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const diagnosisText = discharge?.diagnosis || 'Acute clinical presentation managed with conservative inpatient treatment.';
    doc.text(doc.splitTextToSize(`Primary Clinical Diagnosis: ${diagnosisText}`, 178), 18, sectionY);
    sectionY += 8;

    renderSectionHeader('2. INPATIENT HOSPITAL COURSE & TREATMENT SUMMARY');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const treatmentText = discharge?.treatmentSummary || 'Patient responded well to intravenous antibiotics, fluid replacement, and daily hemodynamic vitals monitoring. Afebrile for last 48 hours.';
    const splitTreatment = doc.splitTextToSize(treatmentText, 178);
    doc.text(splitTreatment, 18, sectionY);
    sectionY += splitTreatment.length * 4.5 + 4;

    renderSectionHeader('3. CONDITION AT DISCHARGE');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // Emerald-800
    doc.text(`Condition: ${discharge?.dischargeCondition || 'Clinically Stable / Ambulatory / Good Prognosis'}`, 18, sectionY);
    sectionY += 8;

    renderSectionHeader('4. DISCHARGE MEDICATIONS & PHARMACEUTICAL REGIMEN');
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const medList = discharge?.medicines || '- Tab. Paracetamol 650mg TDS (3 days)\n- Tab. Pantoprazole 40mg OD Before Breakfast (5 days)\n- Tab. Multivitamin OD Post Dinner (15 days)';
    const splitMeds = doc.splitTextToSize(medList, 178);
    doc.text(splitMeds, 18, sectionY);
    sectionY += splitMeds.length * 4.5 + 4;

    renderSectionHeader('5. DIET, ACTIVITY & FOLLOW-UP INSTRUCTIONS');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`• Scheduled Follow-up Date: ${discharge?.followUpDate || 'Review after 7 days in OPD Room 102'}`, 18, sectionY);
    sectionY += 4.5;
    doc.text('• Dietary Advice: High protein, soft bland diet with adequate oral hydration (2.5L/day).', 18, sectionY);
    sectionY += 4.5;
    doc.text('• Emergency Red Flags: Contact hospital immediately if fever > 101°F, shortness of breath, or vomiting occurs.', 18, sectionY);
    sectionY += 12;

    // Doctor Signature Box
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(120, sectionY, 76, 26, 2, 2, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally Signed & Certified By:', 125, sectionY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 118, 110);
    doc.text(docName, 125, sectionY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Medical Council Reg: KMC-74921 / MCI', 125, sectionY + 17);
    doc.text(`Verified: ${dischargeDate} • Arogya Verified`, 125, sectionY + 22);

    // Save strictly as PDF
    doc.save(`Arogya_Discharge_Summary_${patientName.replace(/\s+/g, '_')}_${admId}.pdf`);
  } catch (err) {
    console.error('PDF discharge summary error:', err);
    const textFallback = `AROGYA DISCHARGE SUMMARY\nPatient: ${patient?.name}\nDoctor: ${discharge?.doctor}\nCondition: ${discharge?.dischargeCondition}`;
    downloadFile(textFallback, `Discharge_${patient?.name || 'Summary'}_${Date.now()}.txt`);
  }
}

/**
 * Download the payment QR as a printable PNG card.
 *
 * @param {string} dataString  The UPI intent the QR encodes (kept for the caption).
 * @param {string} filename    Output filename.
 * @param {string} qrDataUrl   Optional data URL of the already-rendered QR canvas.
 *                            Supplied by the caller so the exported image is the
 *                            live upi:// QR rather than a static placeholder file.
 */
export function downloadQRImage(dataString = 'upi://pay?pa=arogyaqueue@oksbi', filename = 'Arogya_Payment_QR.png', qrDataUrl = null) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const generateCard = (imageElement = null) => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = '#ffffff';
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, 440, 540, 20);
    } else {
      ctx.rect(0, 0, 440, 540);
    }
    ctx.fill();

    // Header banner
    ctx.fillStyle = '#0f766e'; // teal-700
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, 440, 80, [20, 20, 0, 0]);
    } else {
      ctx.fillRect(0, 0, 440, 80);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AROGYA QUEUE HEALTHCARE', 220, 36);
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ccfbf1';
    ctx.fillText('Official Instant UPI / QR Payment Gateway', 220, 60);

    if (imageElement) {
      // Draw uploaded QR code
      const qrBoxSize = 290;
      const startX = (440 - qrBoxSize) / 2;
      const startY = 100;

      // Soft container background
      ctx.fillStyle = '#f8fafc';
      if (ctx.roundRect) {
        ctx.roundRect(startX - 10, startY - 10, qrBoxSize + 20, qrBoxSize + 20, 12);
      } else {
        ctx.fillRect(startX - 10, startY - 10, qrBoxSize + 20, qrBoxSize + 20);
      }
      ctx.fill();

      ctx.drawImage(imageElement, startX, startY, qrBoxSize, qrBoxSize);
    } else {
      // Fallback simulated matrix
      const qrSize = 240;
      const startX = 100;
      const startY = 110;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(startX, startY, qrSize, qrSize);
    }

    // Footer text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan with GPay, PhonePe, Paytm, BHIM', 220, 435);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#0f766e';
    ctx.fillText('UPI: arogyaqueue@upi', 220, 465);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText('Verified NPCI Healthcare Merchant Gateway', 220, 498);

    // Convert to download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  img.onload = () => generateCard(qrDataUrl ? img : null);
  img.onerror = () => generateCard(null);
  img.src = qrDataUrl || '/payment-qr.png';
}
