import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('\n==================================================');
  console.log(' MODULE 7: TASKS & CALENDAR PIPELINE VERIFICATION');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const testTenantId = '00000000-0000-0000-0000-000000000001'; // Acme Travels
  const testUserId = '00000000-0000-0000-0000-000000000004'; // Agent 1

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Note: To emulate end-to-end routing without firing up the Node process,
    // we use the established service layer pattern directly, just like previous modules.
    
    // We import dynamically to ensure env is ready
    const { default: taskService } = await import('./domains/operations/tasks/tasks.service.js');
    const { default: calendarService } = await import('./domains/operations/calendar/calendar.service.js');

    console.log('--- 1. Tasks CRUD & Validation ---');
    const newTaskPayload = {
      title: 'Verify Pipeline Checklist',
      description: 'Ensure automated end-to-end tests pass.',
      priority: 'high',
      status: 'pending',
      assigned_to: testUserId,
      entity_type: 'customer',
      entity_id: '11111111-1111-1111-1111-111111111111', // Dummy UUID for constraint passing if needed, or null
      due_date: new Date().toISOString().split('T')[0]
    };
    
    // If strict FKs are in place, we remove entity_id for test purity
    delete newTaskPayload.entity_id;
    delete newTaskPayload.entity_type;

    let taskId = null;
    try {
      const createdTask = await taskService.createTask(testTenantId, testUserId, newTaskPayload);
      assert(createdTask && createdTask.id, 'Task successfully created');
      taskId = createdTask.id;

      const fetchedTasks = await taskService.listTasks(testTenantId, { assigned_to: testUserId });
      assert(fetchedTasks.some(t => t.id === taskId), 'Task found in list');

      const updatedTask = await taskService.updateTask(testTenantId, taskId, { priority: 'urgent' });
      assert(updatedTask.priority === 'urgent', 'Task priority successfully updated to urgent');

      const completedTask = await taskService.completeTask(testTenantId, taskId);
      assert(completedTask.status === 'completed' && completedTask.completed_at, 'Task successfully marked as completed');

    } catch (e) {
      assert(false, `Task CRUD pipeline failed: ${e.message}`);
      console.error(e);
    }
    
    console.log('\n--- 2. IvoBot Automated Checks (Tasks) ---');
    try {
      const overduePayload = {
         title: 'Forgotten Task',
         priority: 'high',
         due_date: '2023-01-01', // way in the past
         status: 'pending',
         assigned_to: testUserId
      };
      
      const overdueTask = await taskService.createTask(testTenantId, testUserId, overduePayload);
      assert(overdueTask.id, 'Seeded overdue task for IvoBot');
      
      const count = await taskService.checkOverdueTasks();
      assert(count > 0, `IvoBot processed ${count} overdue task notifications`);
      
      await taskService.deleteTask(testTenantId, overdueTask.id);
      
    } catch(e) {
      assert(false, `IvoBot task check failed: ${e.message}`);
      console.error(e);
    }
    
    console.log('\n--- 3. Calendar CRUD ---');
    let eventId = null;
    try {
      const newEvent = {
         title: 'Client Meetup',
         event_type: 'custom',
         start_date: new Date().toISOString().split('T')[0],
         start_time: '14:00'
      };
      const createdEvent = await calendarService.createEvent(testTenantId, testUserId, newEvent);
      assert(createdEvent && createdEvent.id, 'Calendar event successfully created');
      eventId = createdEvent.id;
      
      const fetchedEvents = await calendarService.getEventsInRange(testTenantId, '2024-01-01', '2028-01-01');
      assert(fetchedEvents.some(e => e.id === eventId), 'Calendar event retrieved correctly');
      
      const updatedEvent = await calendarService.updateEvent(testTenantId, eventId, { title: 'Urgent Strategy Meeting' });
      assert(updatedEvent.title === 'Urgent Strategy Meeting', 'Calendar event correctly updated');
      
    } catch(e) {
      assert(false, `Calendar CRUD pipeline failed: ${e.message}`);
      console.error(e);
    }

    console.log('\n--- 4. Unified Agenda Generation ---');
    try {
      const agenda = await calendarService.getAgenda(testTenantId, '2024-01-01', '2028-01-01');
      assert(Array.isArray(agenda), `Generated unified agenda with ${agenda.length} items`);
      
      const hasCalendarItem = agenda.some(a => a.event_type === 'custom');
      assert(hasCalendarItem, 'Agenda successfully integrated custom calendar events');
      
    } catch(e) {
      assert(false, `Agenda Generation failed: ${e.message}`);
      console.error(e);
    }

    // Cleanup
    if (taskId) {
        await taskService.deleteTask(testTenantId, taskId);
        console.log(`\n🧹 Cleaned up test task ${taskId}`);
    }
    if (eventId) {
        await calendarService.deleteEvent(testTenantId, eventId);
        console.log(`🧹 Cleaned up test event ${eventId}`);
    }


  } catch (err) {
    console.log('\n❌ [CRITICAL PIPELINE FAILURE]');
    console.error(err);
  } finally {
    console.log('\n==================================================');
    console.log(` PIPELINE RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

verify();
