import { FastifyRequest, FastifyReply } from 'fastify';
import { QuestionService } from './question.service.js';
import {
    createQuestionSchema,
    bulkCreateQuestionsSchema,
    updateQuestionSchema,
    copyQuestionsSchema,
    questionFiltersSchema,
    questionIdSchema,
    periodIdSchema
} from './question.schema.js';

export class QuestionController {
    private service: QuestionService;

    constructor() {
        this.service = new QuestionService();
    }

    create = async (request: FastifyRequest, reply: FastifyReply) => {
        const { periodId } = periodIdSchema.parse(request.params);
        const body = createQuestionSchema.parse({
            ...(request.body as object),
            periodId
        });

        const question = await this.service.create(body);

        return reply.code(201).send({
            success: true,
            data: question,
        });
    };

    bulkCreate = async (request: FastifyRequest, reply: FastifyReply) => {
        const { periodId } = periodIdSchema.parse(request.params);
        const body = bulkCreateQuestionsSchema.parse({ ...request.body as object, periodId }); // Force periodId check in schema

        const count = await this.service.bulkCreate(periodId, body.questions);

        return reply.code(201).send({
            success: true,
            message: `Создано ${count} вопросов`,
            count,
        });
    };

    getByPeriod = async (request: FastifyRequest, reply: FastifyReply) => {
        const { periodId } = periodIdSchema.parse(request.params);
        const schedule = await this.service.findByPeriod(periodId);

        return reply.send({
            success: true,
            data: schedule,
        });
    };

    getByDay = async (request: FastifyRequest, reply: FastifyReply) => {
        const { periodId } = periodIdSchema.parse(request.params);
        const { dayNumber } = questionFiltersSchema.parse(request.params);

        if (!dayNumber) {
            return reply.code(400).send({ success: false, error: 'Day number is required' });
        }

        const questions = await this.service.findForDay(periodId, dayNumber);

        return reply.send({
            success: true,
            data: questions,
        });
    };

    update = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = questionIdSchema.parse(request.params);
        const body = updateQuestionSchema.parse(request.body);

        const question = await this.service.update(id, body);

        return reply.send({
            success: true,
            data: question,
        });
    };

    delete = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = questionIdSchema.parse(request.params);

        await this.service.delete(id);

        return reply.send({
            success: true,
            message: 'Вопрос удален',
        });
    };

    copy = async (request: FastifyRequest, reply: FastifyReply) => {
        const body = copyQuestionsSchema.parse(request.body);

        const count = await this.service.copyFromPeriod(body.sourcePeriodId, body.targetPeriodId);

        return reply.send({
            success: true,
            message: `Скопировано ${count} вопросов`,
            count,
        });
    };
}
