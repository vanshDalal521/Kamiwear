// Chatbot module for KamiWear
class ChatbotManager {
    constructor() {
        this.chatbotToggle = document.querySelector('.chatbot-toggle');
        this.chatbotWindow = document.querySelector('.chatbot-window');
        this.chatbotClose = document.querySelector('.chatbot-close');
        this.chatbotInput = document.querySelector('.chatbot-input input');
        this.chatbotSend = document.querySelector('.chatbot-input button');
        this.chatbotMessages = document.querySelector('.chatbot-messages');
        this.initializeChatbot();
    }

    initializeChatbot() {
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    attachEventListeners() {
        if (this.chatbotToggle && this.chatbotWindow) {
            this.chatbotToggle.addEventListener('click', () => {
                this.chatbotWindow.classList.toggle('active');
            });
        }

        if (this.chatbotClose) {
            this.chatbotClose.addEventListener('click', () => {
                this.chatbotWindow?.classList.remove('active');
            });
        }

        if (this.chatbotInput && this.chatbotSend) {
            this.chatbotSend.addEventListener('click', () => {
                this.handleUserMessage();
            });

            this.chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleUserMessage();
                }
            });
        }
    }

    addWelcomeMessage() {
        if (this.chatbotMessages) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message bot-message';
            welcomeMessage.innerHTML = `
                <p>👋 Hi there! Welcome to KamiWear. How can I help you today?</p>
                <div class="quick-replies">
                    <button class="quick-reply">Browse Products</button>
                    <button class="quick-reply">Track Order</button>
                    <button class="quick-reply">Size Guide</button>
                    <button class="quick-reply">Contact Support</button>
                </div>
            `;
            this.chatbotMessages.appendChild(welcomeMessage);

            // Add event listeners to quick replies
            const quickReplies = welcomeMessage.querySelectorAll('.quick-reply');
            quickReplies.forEach(reply => {
                reply.addEventListener('click', () => {
                    this.handleQuickReply(reply.textContent);
                });
            });
        }
    }

    handleUserMessage() {
        const message = this.chatbotInput.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.chatbotInput.value = '';
            this.processUserMessage(message);
        }
    }

    handleQuickReply(reply) {
        this.addUserMessage(reply);
        this.processUserMessage(reply);
    }

    addUserMessage(message) {
        if (this.chatbotMessages) {
            const userMessage = document.createElement('div');
            userMessage.className = 'message user-message';
            userMessage.textContent = message;
            this.chatbotMessages.appendChild(userMessage);
            this.scrollToBottom();
        }
    }

    addBotMessage(message, isTyping = true) {
        if (this.chatbotMessages) {
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot-message';
            
            if (isTyping) {
                botMessage.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
                this.chatbotMessages.appendChild(botMessage);
                this.scrollToBottom();

                setTimeout(() => {
                    botMessage.innerHTML = `<p>${message}</p>`;
                    this.scrollToBottom();
                }, 1500);
            } else {
                botMessage.innerHTML = `<p>${message}</p>`;
                this.chatbotMessages.appendChild(botMessage);
                this.scrollToBottom();
            }
        }
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Handle quick replies
        if (message === 'Browse Products') {
            this.addBotMessage('Here are our featured collections:', false);
            this.addBotMessage(`
                <div class="quick-replies">
                    <button class="quick-reply">Demon Slayer</button>
                    <button class="quick-reply">Jujutsu Kaisen</button>
                    <button class="quick-reply">One Piece</button>
                    <button class="quick-reply">View All</button>
                </div>
            `, false);
            this.attachQuickReplyListeners();
        }
        else if (message === 'Track Order') {
            this.addBotMessage('Please enter your order number to track your shipment.');
        }
        else if (message === 'Size Guide') {
            this.addBotMessage('You can find our size guide here: <a href="size-guide.html">Size Guide</a>');
        }
        else if (message === 'Contact Support') {
            this.addBotMessage('Our support team is available 24/7. You can reach us at support@kamiwear.com or call us at 1-800-KAMIWEAR.');
        }
        // Handle general queries
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            this.addBotMessage('Hello! How can I help you today?');
        }
        else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            this.addBotMessage('Our prices vary by product. You can find detailed pricing information on each product page.');
        }
        else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
            this.addBotMessage('We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days.');
        }
        else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
            this.addBotMessage('We have a 30-day return policy. You can find more information in our <a href="returns.html">Returns Policy</a>.');
        }
        else if (lowerMessage.includes('size') || lowerMessage.includes('fit')) {
            this.addBotMessage('We offer sizes from S to XXL. You can find our detailed size guide here: <a href="size-guide.html">Size Guide</a>');
        }
        else {
            this.addBotMessage('I\'m not sure I understand. Could you please rephrase your question or choose from the options below:', false);
            this.addBotMessage(`
                <div class="quick-replies">
                    <button class="quick-reply">Browse Products</button>
                    <button class="quick-reply">Track Order</button>
                    <button class="quick-reply">Size Guide</button>
                    <button class="quick-reply">Contact Support</button>
                </div>
            `, false);
            this.attachQuickReplyListeners();
        }
    }

    attachQuickReplyListeners() {
        const quickReplies = this.chatbotMessages.querySelectorAll('.quick-reply');
        quickReplies.forEach(reply => {
            reply.addEventListener('click', () => {
                this.handleQuickReply(reply.textContent);
            });
        });
    }

    scrollToBottom() {
        if (this.chatbotMessages) {
            this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
        }
    }
}

// Initialize chatbot manager
const chatbotManager = new ChatbotManager(); 