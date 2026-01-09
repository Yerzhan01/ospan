import { FastifyInstance } from 'fastify';
import { taskController } from './task.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

export async function tasksRouter(app: FastifyInstance) {

    app.addHook('preHandler', authMiddleware);

    // Lists
    app.get('/tasks', taskController.list);
    app.get('/tasks/my', taskController.getMyTasks);

    // Detail & Create
    app.get('/tasks/:id', taskController.getById);
    app.post('/tasks', taskController.create);

    // Actions
    app.put('/tasks/:id/status', taskController.updateStatus);
    app.put('/tasks/:id/reassign', taskController.reassign);

    // Full update
    app.put('/tasks/:id', taskController.update);
}

