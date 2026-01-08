import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../common/utils/logger.js';
import { whatsappService } from './whatsapp.service.js';
import { answerService } from '../../modules/answers/answer.service.js';

export const handleWhatsAppWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const body = request.body;
        logger.info({ body }, 'Received WhatsApp webhook');

        // 1. Парсим сообщение
        const message = whatsappService.parseIncomingMessage(body);

        if (!message) {
            // Это может быть уведомление о статусе отправки и т.д.
            // Пока просто игнорируем, но отвечаем 200, чтобы Green-API не слал повторы
            return reply.code(200).send('ok');
        }

        // 2. Логирование входящего сообщения
        const sender = message.senderData.sender;
        const text = message.messageData.textMessageData?.textMessage ||
            message.messageData.extendedTextMessageData?.text ||
            '[Media/Other]';

        logger.info({ sender, text }, 'Incoming WhatsApp message processed');

        // 3. Обработка сообщения через AnswerService
        await answerService.processIncomingMessage(message);

        return reply.code(200).send('ok');

    } catch (error) {
        logger.error({ err: error }, 'Error handling WhatsApp webhook');
        // Все равно возвращаем 200, чтобы не заблокировать очередь вебхуков на стороне провайдера
        return reply.code(200).send('error');
    }
};
