/**
 * 📄 DATE UTILS: Utility per gestione date timezone-safe
 * 
 * 🎯 Scopo: Fornire funzioni per gestire correttamente le date 
 *           evitando problemi di fuso orario tra frontend e backend
 * 
 * 🔧 Principi:
 * - Tutte le date vengono normalizzate al fuso orario locale
 * - Il salvataggio mantiene la data locale senza conversioni UTC
 * - La visualizzazione usa sempre il fuso orario del sistema
 * 
 * @author Finance WebApp Team
 * @modified 1 Settembre 2025 - Creazione utility timezone-safe
 */

/**
 * Converte una data in formato YYYY-MM-DD per il backend
 * mantenendo il fuso orario locale (NON UTC)
 * 
 * @param {Date} date - Data da convertire
 * @returns {string} - Data in formato YYYY-MM-DD (locale)
 */
export function formatDateForAPI(date) {
  if (!date) return null;
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte una data in formato ISO string per il backend
 * mantenendo il fuso orario locale (NON UTC)
 * 
 * @param {Date} date - Data da convertire  
 * @returns {string} - Data in formato ISO locale
 */
export function formatDateTimeForAPI(date) {
  if (!date) return null;
  
  const d = new Date(date);
  
  // Ottieni componenti della data locale
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // Restituisci in formato ISO ma con orario locale
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Crea una data da una stringa mantenendo il fuso orario locale
 * 
 * @param {string} dateString - Stringa data (YYYY-MM-DD o ISO)
 * @returns {Date} - Data con fuso orario locale
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null;
  
  // Se è solo YYYY-MM-DD, aggiungi ore per evitare UTC
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + 'T12:00:00'); // Mezzogiorno locale
  }
  
  return new Date(dateString);
}

/**
 * Formatta una data per la visualizzazione (locale)
 * 
 * @param {Date|string} date - Data da formattare
 * @param {string} locale - Locale (default: 'it-IT')
 * @returns {string} - Data formattata
 */
export function formatDateForDisplay(date, locale = 'it-IT') {
  if (!date) return '';
  
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!d) return '';
  
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  });
}

/**
 * Ottieni data di oggi in formato YYYY-MM-DD (locale)
 * 
 * @returns {string} - Data di oggi
 */
export function getTodayLocal() {
  return formatDateForAPI(new Date());
}

/**
 * Ottieni oggetto Date di oggi (locale)
 * 
 * @returns {Date} - Data di oggi come oggetto Date
 */
export function getTodayDate() {
  return new Date();
}

/**
 * Ottieni inizio e fine mese per una data (locale)
 * 
 * @param {Date} date - Data di riferimento
 * @returns {Object} - { start: Date, end: Date }
 */
export function getMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Ottieni inizio e fine anno per una data (locale)
 * 
 * @param {Date} date - Data di riferimento
 * @returns {Object} - { start: Date, end: Date }
 */
export function getYearBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1, 0, 0, 0);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  return { start, end };
}
