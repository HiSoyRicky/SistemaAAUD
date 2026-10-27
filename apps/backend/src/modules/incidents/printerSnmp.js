import dgram from 'node:dgram';
import { randomInt } from 'node:crypto';

const BASE = [1, 3, 6, 1, 2, 1, 43, 11, 1, 1];
const encodeLength = (n) => n < 128 ? Buffer.from([n]) : Buffer.from([0x81, n]);
const tlv = (tag, value) => Buffer.concat([Buffer.from([tag]), encodeLength(value.length), value]);
function integer(n) {
  const bytes = [];
  do { bytes.unshift(n & 255); n >>>= 8; } while (n);
  if (bytes[0] & 128) bytes.unshift(0);
  return tlv(2, Buffer.from(bytes));
}
function encodeOid(oid) {
  const bytes = [oid[0] * 40 + oid[1]];
  for (let n of oid.slice(2)) {
    const part = [n & 127];
    while ((n = Math.floor(n / 128)) > 0) part.unshift((n & 127) | 128);
    bytes.push(...part);
  }
  return tlv(6, Buffer.from(bytes));
}
function readTlv(buffer, offset = 0) {
  if (offset + 2 > buffer.length) throw new Error('Respuesta SNMP incompleta');
  const tag = buffer[offset++]; let length = buffer[offset++];
  if (length & 128) {
    const count = length & 127;
    if (!count || count > 2 || offset + count > buffer.length) throw new Error('Longitud SNMP inválida');
    length = buffer.readUIntBE(offset, count); offset += count;
  }
  if (offset + length > buffer.length) throw new Error('Respuesta SNMP incompleta');
  return { tag, value: buffer.subarray(offset, offset + length), next: offset + length };
}
function fields(buffer) {
  const result = []; let offset = 0;
  while (offset < buffer.length) { const field = readTlv(buffer, offset); result.push(field); offset = field.next; }
  return result;
}
function signed(bytes) { return bytes.length && bytes.length <= 4 ? bytes.readIntBE(0, bytes.length) : NaN; }
function decodeOid(bytes) {
  if (!bytes.length) throw new Error('OID vacío');
  const oid = [Math.floor(bytes[0] / 40), bytes[0] % 40]; let number = 0;
  for (const byte of bytes.subarray(1)) { number = number * 128 + (byte & 127); if (number > 0x7fffffff) throw new Error('OID inválido'); if (!(byte & 128)) { oid.push(number); number = 0; } }
  if (bytes[bytes.length - 1] & 128) throw new Error('OID incompleto');
  return oid;
}
export function decodeResponse(packet, requestId, community) {
  const root = readTlv(packet);
  if (root.tag !== 48 || root.next !== packet.length) throw new Error('Respuesta SNMP inválida');
  const [version, receivedCommunity, pdu] = fields(root.value);
  if (version?.tag !== 2 || signed(version.value) !== 1 || receivedCommunity?.tag !== 4 || receivedCommunity.value.toString() !== community || pdu?.tag !== 0xa2) throw new Error('Respuesta SNMP inesperada');
  const [id, error, , bindings] = fields(pdu.value);
  if (id?.tag !== 2 || signed(id.value) !== requestId || error?.tag !== 2 || signed(error.value) !== 0 || bindings?.tag !== 48) throw new Error('Error SNMP');
  const [binding] = fields(bindings.value); if (binding?.tag !== 48) throw new Error('Respuesta SNMP vacía');
  const [name, value] = fields(binding.value);
  if (name?.tag !== 6 || !value) throw new Error('Respuesta SNMP inválida');
  return { oid: decodeOid(name.value), value: value.tag === 4 ? value.value.toString('utf8') : value.tag === 2 ? signed(value.value) : null };
}
function makeRequest(oid, id, community) {
  const binding = tlv(48, Buffer.concat([encodeOid(oid), tlv(5, Buffer.alloc(0))]));
  const pdu = tlv(0xa1, Buffer.concat([integer(id), integer(0), integer(0), tlv(48, binding)]));
  return tlv(48, Buffer.concat([integer(1), tlv(4, Buffer.from(community)), pdu]));
}
export async function readPrinterSupplies(ip, { community = process.env.PRINTER_SNMP_COMMUNITY || 'public', timeoutMs = 3000 } = {}) {
  if (Buffer.byteLength(community) > 64) throw new Error('Comunidad SNMP inválida');
  const socket = dgram.createSocket('udp4'); const deadline = Date.now() + timeoutMs;
  try {
    await new Promise((resolve, reject) => { socket.once('error', reject); socket.connect(161, ip, resolve); });
    const next = (oid) => new Promise((resolve, reject) => {
      const remaining = deadline - Date.now(); if (remaining <= 0) return reject(new Error('Tiempo agotado'));
      const id = randomInt(1, 0x7fffffff); const timer = setTimeout(() => finish(new Error('Tiempo agotado')), remaining);
      const finish = (error, value) => { clearTimeout(timer); socket.off('message', onMessage); socket.off('error', onError); error ? reject(error) : resolve(value); };
      const onError = (error) => finish(error);
      const onMessage = (packet) => { try { finish(null, decodeResponse(packet, id, community)); } catch (error) { finish(error); } };
      socket.once('message', onMessage); socket.once('error', onError); socket.send(makeRequest(oid, id, community), (error) => { if (error) finish(error); });
    });
    const columns = {};
    for (const column of [6, 8, 9]) {
      const prefix = [...BASE, column]; let oid = prefix; columns[column] = {};
      for (let i = 0; i < 32; i++) {
        const row = await next(oid);
        if (!prefix.every((value, index) => row.oid[index] === value) || row.oid.length <= prefix.length) break;
        if (row.oid.join('.') === oid.join('.')) throw new Error('OID SNMP repetido');
        oid = row.oid; columns[column][oid.slice(prefix.length).join('.')] = row.value;
      }
    }
    return Object.entries(columns[6]).map(([index, model]) => {
      const max = columns[8][index], level = columns[9][index];
      return { model: String(model || ''), percent: Number.isFinite(max) && max > 0 && Number.isFinite(level) && level >= 0 && level <= max ? Math.round(level * 100 / max) : null };
    });
  } finally { socket.close(); }
}
