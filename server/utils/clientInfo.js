// clientInfo.js

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const remote = req.socket?.remoteAddress || req.connection?.remoteAddress;
    const ip = forwarded || remote || null;

    return ip ? ip.replace(/^::ffff:/, '') : null;
}

export { getClientIp };