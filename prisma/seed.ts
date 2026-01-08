import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, PatientStatus, PeriodStatus, TimeSlot, ResponseType } from '@prisma/client';
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

const USERS_DATA = [
    { email: 'admin@clinic.com', password: 'admin123', role: UserRole.ADMIN, fullName: 'Администратор Системы' },
    { email: 'tracker1@clinic.com', password: 'tracker123', role: UserRole.TRACKER, fullName: 'Трекер Первый' },
    { email: 'tracker2@clinic.com', password: 'tracker123', role: UserRole.TRACKER, fullName: 'Трекер Второй' },
    { email: 'doctor@clinic.com', password: 'doctor123', role: UserRole.DOCTOR, fullName: 'Доктор Иванов' },
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
const QUESTION_TEMPLATES = [
    // День 1
    { dayNumber: 1, timeSlot: TimeSlot.MORNING, questionText: 'Доброе утро! Как вы себя чувствуете?', responseType: ResponseType.TEXT },
    { dayNumber: 1, timeSlot: TimeSlot.AFTERNOON, questionText: 'Приняли ли вы витамины?', responseType: ResponseType.TEXT },
    { dayNumber: 1, timeSlot: TimeSlot.EVENING, questionText: 'Отправьте фото вашего ужина', responseType: ResponseType.PHOTO },
    // День 2
    { dayNumber: 2, timeSlot: TimeSlot.MORNING, questionText: 'Как прошла ночь? Выспались?', responseType: ResponseType.TEXT },
    { dayNumber: 2, timeSlot: TimeSlot.AFTERNOON, questionText: 'Как ваше самочувствие?', responseType: ResponseType.TEXT },
    { dayNumber: 2, timeSlot: TimeSlot.EVENING, questionText: 'Фото отчёт за день', responseType: ResponseType.TEXT_AND_PHOTO },
    // День 3
    { dayNumber: 3, timeSlot: TimeSlot.MORNING, questionText: 'Доброе утро! Есть ли жалобы?', responseType: ResponseType.TEXT },
    { dayNumber: 3, timeSlot: TimeSlot.AFTERNOON, questionText: 'Всё ли в порядке с приёмом препаратов?', responseType: ResponseType.TEXT },
    { dayNumber: 3, timeSlot: TimeSlot.EVENING, questionText: 'Итоги дня - как себя чувствуете?', responseType: ResponseType.TEXT },
];

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
    console.log('\n❓ Создание шаблонов вопросов...');

    let created = 0;
    let existing = 0;

    for (const template of QUESTION_TEMPLATES) {
        const exists = await prisma.questionTemplate.findFirst({
            where: {
                periodId,
                dayNumber: template.dayNumber,
                timeSlot: template.timeSlot,
            },
        });

        if (exists) {
            existing++;
            continue;
        }

        await prisma.questionTemplate.create({
            data: {
                ...template,
                periodId,
                order: 0,
                isRequired: true,
            },
        });
        created++;
    }

    console.log(`   ✅ Создано ${created} шаблонов вопросов`);
    if (existing > 0) {
        console.log(`   ✓ ${existing} шаблонов уже существовало`);
    }
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
