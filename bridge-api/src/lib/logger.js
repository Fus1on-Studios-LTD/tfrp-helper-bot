function timestamp() {
  return new Date().toISOString();
}

module.exports = {
  info(message, ...rest) {
    console.log(`[${timestamp()}] INFO  ${message}`, ...rest);
  },
  warn(message, ...rest) {
    console.warn(`[${timestamp()}] WARN  ${message}`, ...rest);
  },
  error(message, ...rest) {
    console.error(`[${timestamp()}] ERROR ${message}`, ...rest);
  },
};
