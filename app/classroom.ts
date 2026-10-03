import { database } from '../db/raw';

export async function classroomState() {
  const row = await database().prepare('SELECT opened, revision, student_create, featured_code FROM classroom WHERE id=1').first<{opened:number;revision:number;student_create:number;featured_code:string|null}>();
  if (!row) throw new Error('Classroom configuration missing');
  return {open:row.opened===1,revision:row.revision,studentCreate:true,featuredCode:row.featured_code};
}
