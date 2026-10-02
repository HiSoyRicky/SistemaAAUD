// clientInfo.js

function getClientIp(req) {
  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress;
  const ip = req.ip || remote || null;

  return ip ? ip.replace(/^::ffff:/, '') : null;
}

export { getClientIp };
