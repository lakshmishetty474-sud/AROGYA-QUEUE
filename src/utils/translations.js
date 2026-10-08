/**
 * Arogya Queue — Multi-language translation & speech announcement engine
 * Supports English (en), Kannada (kn), and Hindi (hi)
 */

import {
  speakAnnouncement,
  buildAnnouncementText,
  SUPPORTED_LANGUAGES,
  getAvailableVoices,
  findVoiceForLanguage,
  findKannadaVoice,
  isVoiceAvailableForLanguage,
  getLastVoiceDebugInfo,
  subscribeVoiceWarnings,
} from '../services/speechService.js';

export const TRANSLATIONS = {
  en: {
    appName: 'AROGYA QUEUE',
    hospitalOS: 'Hospital OS + City Health Care',
    nowServing: 'NOW SERVING',
    nextToken: 'NEXT TOKEN',
    estimatedWait: 'Estimated Wait',
    queuePosition: 'Queue Position',
    callNext: 'CALL NEXT',
    completeConsultation: 'Complete Consultation',
    activeOPDQueue: 'Active OPD Queue',
    scheduledAppointments: 'Scheduled Consultations',
    bookAppointment: 'Book Appointment',
    patientRegistration: 'Patient Intake & Registration',
    myReports: 'My Diagnostic Reports',
    activePrescriptions: 'Active Prescriptions',
    medicalHistory: 'Medical History',
    helpSupport: 'Help & Support',
    cityGrid: 'Arogya City Grid',
    emergencyMode: 'CITY EMERGENCY MODE',
    bedMatrix: 'Hospital Bed Matrix',
    pharmacySupply: 'Pharmacy & Formulary',
    patientFeedback: 'Patient Experience & Rating',
    speechAnnouncement: (token, room) => buildAnnouncementText(token, room, 'en'),
    speechLang: 'en-IN',
  },
  kn: {
    appName: 'ಆರೋಗ್ಯ ಕ್ಯೂ',
    hospitalOS: 'ಆಸ್ಪತ್ರೆ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್ + ನಗರ ಆರೋಗ್ಯ ಗ್ರಿಡ್',
    nowServing: 'ಪ್ರಸ್ತುತ ಕರೆದ ಟೋಕನ್',
    nextToken: 'ಮುಂದಿನ ಟೋಕನ್',
    estimatedWait: 'ಅಂದಾಜು ಕಾಯುವ ಸಮಯ',
    queuePosition: 'ಕ್ಯೂ ಸ್ಥಾನ',
    callNext: 'ಮುಂದಿನ ರೋಗಿಯನ್ನು ಕರೆಯಿರಿ',
    completeConsultation: 'ಸಮಾಲೋಚನೆ ಪೂರ್ಣಗೊಳಿಸಿ',
    activeOPDQueue: 'ಸಕ್ರಿಯ ಒಪಿಡಿ ಸರದಿ',
    scheduledAppointments: 'ಮುಂಗಡ ಸಮಾಲೋಚನೆಗಳು',
    bookAppointment: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    patientRegistration: 'ರೋಗಿ ನೋಂದಣಿ',
    myReports: 'ನನ್ನ ರೋಗನಿರ್ಣಯ ವರದಿಗಳು',
    activePrescriptions: 'ಔಷಧಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು',
    medicalHistory: 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ',
    helpSupport: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    cityGrid: 'ಆರೋಗ್ಯ ನಗರ ಗ್ರಿಡ್',
    emergencyMode: 'ನಗರ ತುರ್ತು ಸ್ಥಿತಿ',
    bedMatrix: 'ಆಸ್ಪತ್ರೆ ಹಾಸಿಗೆ ಮ್ಯಾಟ್ರಿಕ್ಸ್',
    pharmacySupply: 'ಔಷಧಾಲಯ ಮತ್ತು ವಿತರಣೆ',
    patientFeedback: 'ರೋಗಿಗಳ ಅನುಭವ ಮತ್ತು ರೇಟಿಂಗ್',
    speechAnnouncement: (token, room) => buildAnnouncementText(token, room, 'kn'),
    speechLang: 'kn-IN',
  },
  hi: {
    appName: 'आरोग्य कतार',
    hospitalOS: 'अस्पताल ऑपरेटिंग सिस्टम + नगर स्वास्थ्य ग्रिड',
    nowServing: 'वर्तमान टोकन',
    nextToken: 'अगला टोकन',
    estimatedWait: 'अनुमानित प्रतीक्षा समय',
    queuePosition: 'कतार स्थिति',
    callNext: 'अगले मरीज को बुलाएं',
    completeConsultation: 'परामर्श पूरा करें',
    activeOPDQueue: 'सक्रिय ओपीडी कतार',
    scheduledAppointments: 'आरक्षित परामर्श',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    patientRegistration: 'मरीज पंजीकरण',
    myReports: 'मेरी जांच रिपोर्ट',
    activePrescriptions: 'सक्रिय नुस्खे',
    medicalHistory: 'चिकित्सा इतिहास',
    helpSupport: 'सहायता एवं संपर्क',
    cityGrid: 'आरोग्य नगर ग्रिड',
    emergencyMode: 'नगर आपातकालीन प्रोटोकॉल',
    bedMatrix: 'अस्पताल बिस्तर मैट्रिक्स',
    pharmacySupply: 'फार्मेसी एवं औषधि वितरण',
    patientFeedback: 'मरीज अनुभव एवं रेटिंग',
    speechAnnouncement: (token, room) => buildAnnouncementText(token, room, 'hi'),
    speechLang: 'hi-IN',
  },
};

/**
 * Announce token using browser speech synthesis with multilingual voice support
 * Handles English, Hindi, and Kannada with asynchronous voice detection
 */
export function announceToken(token, room = 'Consultation Room 1', lang = 'en', options = {}) {
  return speakAnnouncement(token, room, lang, options);
}

export {
  speakAnnouncement,
  buildAnnouncementText,
  SUPPORTED_LANGUAGES,
  getAvailableVoices,
  findVoiceForLanguage,
  findKannadaVoice,
  isVoiceAvailableForLanguage,
  getLastVoiceDebugInfo,
  subscribeVoiceWarnings,
};
