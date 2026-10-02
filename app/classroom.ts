import { database } from '../db/raw';

export async function classroomState() {
  const row = await database().prepare('SELECT opened, revision FROM classroom WHERE id=1').first<{opened:number;revision:number}>();
  if (!row) throw new Error('Classroom configuration missing');
  return {open:row.opened===1,revision:row.revision};
}
