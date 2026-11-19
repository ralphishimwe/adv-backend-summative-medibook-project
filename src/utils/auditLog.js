const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

const writeAuditLog = async (event, details) => {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    const entry = { timestamp: new Date().toISOString(), event, ...details };
    await fs.appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`);
  } catch (err) {
    console.error('Could not write to audit log:', err.message);
  }
};

module.exports = writeAuditLog;