import {test} from 'node:test';
import assert from 'node:assert/strict';
import {minutes,colombiaNow,lastDate,availableSlots} from '../directorio/booking-utils.js';
test('Colombia keeps the correct day after UTC midnight',()=>{
  assert.deepEqual(colombiaNow(new Date('2026-10-08T01:00:00Z')), {date:'2026-10-07',minute:1200});
});
test('Busy times match alternate formatting',()=>{
  const result = availableSlots('2026-10-08',['8.30 am','02:00 pm'],new Date('2026-10-07T14:00:00Z'));
  assert(!result.includes('08:30 am')); assert(!result.includes('02:00 pm')); assert(result.includes('09:00 am'));
});
test('Same-day requests need thirty minutes lead time',()=>{
  const result = availableSlots('2026-10-07',[],new Date('2026-10-07T14:15:00Z'));
  assert(!result.includes('09:30 am')); assert(result.includes('10:00 am'));
});
test('Reject past dates and dates outside the app fourteen-day window',()=>{
  const now = new Date('2026-10-07T14:00:00Z');
  assert.equal(lastDate(now),'2026-10-20');
  assert.deepEqual(availableSlots('2026-10-06',[],now),[]);
  assert.deepEqual(availableSlots('2026-10-21',[],now),[]);
  assert(availableSlots('2026-10-20',[],now).length > 0);
});
test('Noon and midnight parse correctly',()=>{ assert.equal(minutes('12:00 pm'),720); assert.equal(minutes('12:00 am'),0); });
