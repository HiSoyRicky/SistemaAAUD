import { prisma } from '../../config/prisma.js';

export async function synchronizeIncidentTicketNumberSequence(db = prisma) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`LOCK TABLE "bd_incidents" IN SHARE ROW EXCLUSIVE MODE`;
    await tx.$queryRaw`
      WITH ticket_state AS (
        SELECT
          pg_get_serial_sequence('"bd_incidents"', 'ticket_number')::regclass AS sequence_oid,
          COALESCE(MAX("ticket_number"), 1) AS max_ticket,
          MAX("ticket_number") IS NOT NULL AS has_tickets
        FROM "bd_incidents"
      )
      SELECT setval(
        sequence_oid,
        GREATEST(max_ticket, COALESCE(pg_sequence_last_value(sequence_oid), 1)),
        has_tickets OR pg_sequence_last_value(sequence_oid) IS NOT NULL
      )
      FROM ticket_state
    `;
  });
}