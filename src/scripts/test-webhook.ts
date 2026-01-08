
async function testWebhook() {
    console.log('Testing WhatsApp Webhook...');

    const payload = {
        typeWebhook: 'incomingMessageReceived',
        instanceData: {
            idInstance: 12345,
            wid: '1234567890@c.us',
            typeInstance: 'whatsapp'
        },
        timestamp: 1672531200,
        idMessage: 'BAE567890',
        senderData: {
            chatId: '77011234567@c.us',
            sender: '77011234567@c.us',
            senderName: 'Test User'
        },
        messageData: {
            typeMessage: 'textMessage',
            textMessageData: {
                textMessage: 'Hello World'
            }
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/v1/webhook/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Webhook Response Status:', response.status);
        const data = await response.json();
        console.log('Webhook Response Data:', data);
    } catch (error: any) {
        console.error('Webhook Error:', error.message);
    }
}

testWebhook();
