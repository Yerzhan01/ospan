import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrisma } from '../../config/database.js';
import { answerService } from './answer.service.js';
import { z } from 'zod';

export class AnswerController {

    // GET /api/v1/patients/:patientId/answers
    async getPatientAnswers(
        request: FastifyRequest<{ Params: { patientId: string } }>,
        reply: FastifyReply
    ) {
        const { patientId } = request.params;

        // Optional filtering query params could be added here
        const prisma = await getPrisma();
        const answers = await prisma.answer.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            include: { questionTemplate: true }
        });

        return reply.send(answers);
    }

    // GET /api/v1/periods/:periodId/answers
    async getPeriodAnswers(
        request: FastifyRequest<{ Params: { periodId: string } }>,
        reply: FastifyReply
    ) {
        const { periodId } = request.params;

        const prisma = await getPrisma();
        const answers = await prisma.answer.findMany({
            where: { periodId },
            orderBy: { createdAt: 'desc' },
            include: { questionTemplate: true }
        });

        return reply.send(answers);
    }

    // GET /api/v1/answers/:id
    async getAnswerById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = request.params;

        const prisma = await getPrisma();
        const answer = await prisma.answer.findUnique({
            where: { id },
            include: { questionTemplate: true, patient: true }
        });

        if (!answer) {
            return reply.status(404).send({ error: 'Answer not found' });
        }

        return reply.send(answer);
    }
}

export const answerController = new AnswerController();
