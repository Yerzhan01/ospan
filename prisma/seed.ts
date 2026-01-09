import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, PatientStatus, PeriodStatus, TimeSlot, ResponseType, AlertType, AlertStatus, TaskType, TaskStatus, RiskLevel } from '@prisma/client';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Создаём подключение с адаптером (Prisma 7)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

// ============================================
// ДАННЫЕ ДЛЯ SEED
// ============================================

const CLINIC_DATA = {
    name: 'Клиника Здоровье',
    address: 'ул. Медицинская, 1',
    phone: '+7 (999) 123-45-67',
    email: 'info@clinic-zdorovie.kz',
};

// Default passwords for seed - OVERRIDE VIA ENV VARS IN PRODUCTION
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin2024';
const DEFAULT_TRACKER_PASSWORD = process.env.SEED_TRACKER_PASSWORD || 'ChangeMe!Tracker2024';
const DEFAULT_DOCTOR_PASSWORD = process.env.SEED_DOCTOR_PASSWORD || 'ChangeMe!Doctor2024';

if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('⚠️  WARNING: Using default seed passwords. Set SEED_*_PASSWORD env vars in production!');
}

const USERS_DATA = [
    { email: 'admin@clinic.com', password: DEFAULT_ADMIN_PASSWORD, role: UserRole.ADMIN, fullName: 'Администратор Системы' },
    { email: 'tracker1@clinic.com', password: DEFAULT_TRACKER_PASSWORD, role: UserRole.TRACKER, fullName: 'Трекер Первый' },
    { email: 'tracker2@clinic.com', password: DEFAULT_TRACKER_PASSWORD, role: UserRole.TRACKER, fullName: 'Трекер Второй' },
    { email: 'doctor@clinic.com', password: DEFAULT_DOCTOR_PASSWORD, role: UserRole.DOCTOR, fullName: 'Доктор Иванов' },
];

const PATIENT_DATA = {
    fullName: 'Иванов Иван Иванович',
    phone: '+79991234567',
    status: PatientStatus.ACTIVE,
};

const PERIOD_DATA = {
    name: 'Адаптационный период',
    durationDays: 14,
    status: PeriodStatus.ACTIVE,
};

// Шаблоны вопросов для первых 3 дней
// Генерация шаблонов вопросов для 14 дней
const QUESTION_TEMPLATES: any[] = [];
for (let day = 1; day <= 14; day++) {
    QUESTION_TEMPLATES.push(
        { dayNumber: day, timeSlot: TimeSlot.MORNING, questionText: `День ${day}: Как спалось?`, responseType: ResponseType.TEXT },
        { dayNumber: day, timeSlot: TimeSlot.AFTERNOON, questionText: `День ${day}: Приняли лекарства?`, responseType: ResponseType.TEXT },
        { dayNumber: day, timeSlot: TimeSlot.EVENING, questionText: `День ${day}: Отчет за день`, responseType: ResponseType.PHOTO }
    );
}

// ============================================
// ФУНКЦИИ SEED
// ============================================

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedClinic() {
    console.log('🏥 Создание клиники...');

    const existing = await prisma.clinic.findFirst({
        where: { name: CLINIC_DATA.name },
    });

    if (existing) {
        console.log(`   ✓ Клиника "${CLINIC_DATA.name}" уже существует (id: ${existing.id})`);
        return existing;
    }

    const clinic = await prisma.clinic.create({
        data: CLINIC_DATA,
    });

    console.log(`   ✅ Создана клиника "${clinic.name}" (id: ${clinic.id})`);
    return clinic;
}

async function seedUsers(clinicId: string) {
    console.log('\n👥 Создание пользователей...');

    const users: Record<string, { id: string; role: UserRole }> = {};

    for (const userData of USERS_DATA) {
        const existing = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existing) {
            console.log(`   ✓ ${userData.role}: ${userData.email} (id: ${existing.id})`);
            users[userData.email] = { id: existing.id, role: existing.role };
            continue;
        }

        const passwordHash = await hashPassword(userData.password);

        const user = await prisma.user.create({
            data: {
                email: userData.email,
                passwordHash,
                role: userData.role,
                fullName: userData.fullName,
                clinicId,
            },
        });

        console.log(`   ✅ ${userData.role}: ${userData.email} (id: ${user.id})`);
        users[userData.email] = { id: user.id, role: user.role };
    }

    return users;
}

async function seedPatient(clinicId: string, trackerId: string, doctorId: string) {
    console.log('\n🧑‍⚕️ Создание пациента...');

    const existing = await prisma.patient.findUnique({
        where: { phone: PATIENT_DATA.phone },
    });

    if (existing) {
        console.log(`   ✓ Пациент "${PATIENT_DATA.fullName}" уже существует (id: ${existing.id})`);
        return existing;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patient = await prisma.patient.create({
        data: {
            fullName: PATIENT_DATA.fullName,
            phone: PATIENT_DATA.phone,
            status: PATIENT_DATA.status,
            programStartDate: today,
            clinicId,
            trackerId,
            doctorId,
        },
    });

    console.log(`   ✅ Создан пациент "${patient.fullName}" (id: ${patient.id})`);
    return patient;
}

async function seedPeriod(patientId: string) {
    console.log('\n📅 Создание периода сопровождения...');

    const existing = await prisma.period.findFirst({
        where: {
            patientId,
            name: PERIOD_DATA.name,
        },
    });

    if (existing) {
        console.log(`   ✓ Период "${PERIOD_DATA.name}" уже существует (id: ${existing.id})`);
        return existing;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + PERIOD_DATA.durationDays);

    const period = await prisma.period.create({
        data: {
            name: PERIOD_DATA.name,
            durationDays: PERIOD_DATA.durationDays,
            startDate: today,
            endDate,
            status: PERIOD_DATA.status,
            patientId,
        },
    });

    // Обновляем currentPeriodId у пациента
    await prisma.patient.update({
        where: { id: patientId },
        data: { currentPeriodId: period.id },
    });

    console.log(`   ✅ Создан период "${period.name}" (id: ${period.id})`);
    return period;
}

async function seedQuestionTemplates(periodId: string) {
    console.log('\n❓ Создание шаблонов вопросов (14 дней)...');

    let created = 0;

    // Используем createMany для скорости
    const data = QUESTION_TEMPLATES.map(t => ({
        ...t,
        periodId,
        order: 0,
        isRequired: true,
    }));

    const result = await prisma.questionTemplate.createMany({
        data,
        skipDuplicates: true,
    });

    console.log(`   ✅ Создано ${result.count} шаблонов вопросов`);
}

async function seedAnswers(patientId: string, periodId: string) {
    console.log('\n💬 Создание тестовых ответов (для графиков)...');

    const today = new Date();
    let count = 0;

    // Создаем ответы за последние 7 дней
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // 1-3 ответа в день
        const answersCount = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < answersCount; j++) {
            await prisma.answer.create({
                data: {
                    dayNumber: 1, // Тут не важно для графика, главное дата создания
                    timeSlot: j === 0 ? TimeSlot.MORNING : j === 1 ? TimeSlot.AFTERNOON : TimeSlot.EVENING,
                    textContent: `Тестовый ответ за ${date.toLocaleDateString()}`,
                    patientId,
                    periodId,
                    createdAt: date,
                    isProcessed: true,
                }
            });
            count++;
        }
    }
    console.log(`   ✅ Создано ${count} ответов за последние 7 дней`);
}

async function seedAlertsAndTasks(patientId: string, trackerId: string, doctorId: string) {
    console.log('\n🚨 Создание тестовых алёртов и задач...');

    // Check if alerts already exist
    const existingAlerts = await prisma.alert.count({ where: { patientId } });
    if (existingAlerts > 0) {
        console.log(`   ✓ ${existingAlerts} алёртов уже существует`);
        return;
    }

    // Create test alerts with different risk levels
    const alerts = [
        {
            type: AlertType.MISSED_RESPONSE,
            title: 'Пропущен ответ на утренний вопрос',
            description: 'Пациент не ответил на вопрос "Как вы себя чувствуете?" в течение 2 часов',
            riskLevel: RiskLevel.MEDIUM,
            status: AlertStatus.NEW,
            patientId,
            triggeredBy: 'SYSTEM',
        },
        {
            type: AlertType.BAD_CONDITION,
            title: 'Плохое самочувствие',
            description: 'AI анализ выявил негативные симптомы в ответе пациента',
            riskLevel: RiskLevel.HIGH,
            status: AlertStatus.NEW,
            patientId,
            triggeredBy: 'AI_ANALYSIS',
        },
        {
            type: AlertType.NO_PHOTO,
            title: 'Не отправлено фото еды',
            description: 'Пациент не отправил фото ужина за вчерашний день',
            riskLevel: RiskLevel.LOW,
            status: AlertStatus.IN_PROGRESS,
            patientId,
            triggeredBy: 'SYSTEM',
        },
    ];

    for (const alertData of alerts) {
        const alert = await prisma.alert.create({ data: alertData });
        console.log(`   ✅ Создан алёрт: ${alertData.title} (${alertData.riskLevel})`);

        // Create task for each alert
        const taskType = alertData.type === AlertType.MISSED_RESPONSE ? TaskType.CALL :
            alertData.type === AlertType.NO_PHOTO ? TaskType.CHECK_PHOTO :
                TaskType.ESCALATE;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow

        await prisma.task.create({
            data: {
                type: taskType,
                title: `Обработать: ${alertData.title}`,
                description: alertData.description,
                status: TaskStatus.PENDING,
                priority: alertData.riskLevel === RiskLevel.HIGH ? 8 :
                    alertData.riskLevel === RiskLevel.MEDIUM ? 5 : 3,
                dueDate,
                patientId,
                assignedToId: trackerId,
                alertId: alert.id,
            }
        });
    }

    console.log(`   ✅ Создано 3 алёрта и 3 задачи`);
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('═'.repeat(50));
    console.log('🌱 ЗАПУСК SEED СКРИПТА');
    console.log('═'.repeat(50));

    try {
        // 1. Создаём клинику
        const clinic = await seedClinic();

        // 2. Создаём пользователей
        const users = await seedUsers(clinic.id);

        // Находим tracker1 и doctor
        const tracker1 = users['tracker1@clinic.com'];
        const doctor = users['doctor@clinic.com'];

        if (!tracker1 || !doctor) {
            throw new Error('Не удалось найти tracker1 или doctor');
        }

        // 3. Создаём пациента
        const patient = await seedPatient(clinic.id, tracker1.id, doctor.id);

        // 4. Создаём период
        const period = await seedPeriod(patient.id);

        // 5. Создаём шаблоны вопросов
        await seedQuestionTemplates(period.id);

        // 6. Создаём тестовые алёрты и задачи
        await seedAlertsAndTasks(patient.id, tracker1.id, doctor.id);

        // 7. Создаём тестовые ответы
        await seedAnswers(patient.id, period.id);

        console.log('\n' + '═'.repeat(50));
        console.log('✅ SEED ЗАВЕРШЁН УСПЕШНО!');
        console.log('═'.repeat(50));

        // Выводим сводку
        console.log('\n📋 СВОДКА:');
        console.log(`   Клиника: ${clinic.name}`);
        console.log(`   Пользователей: ${Object.keys(users).length}`);
        console.log(`   Пациент: ${patient.fullName}`);
        console.log(`   Период: ${period.name} (${period.durationDays} дней)`);
        console.log(`   Шаблонов вопросов: ${QUESTION_TEMPLATES.length}`);

        console.log('\n🔐 ТЕСТОВЫЕ АККАУНТЫ:');
        for (const user of USERS_DATA) {
            console.log(`   ${user.role.padEnd(8)}: ${user.email} / ${user.password}`);
        }

    } catch (error) {
        console.error('\n❌ ОШИБКА ПРИ SEED:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
