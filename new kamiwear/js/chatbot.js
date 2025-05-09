document.addEventListener('DOMContentLoaded', function() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    
    // Toggle chatbot window
    chatbotToggle.addEventListener('click', function() {
        chatbotWindow.classList.toggle('active');
    });
    
    // Close chatbot
    chatbotClose.addEventListener('click', function() {
        chatbotWindow.classList.remove('active');
    });
    
    // Send message
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            chatbotInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Bot response (simulated)
            setTimeout(function() {
                removeTypingIndicator();
                const botResponse = generateBotResponse(message);
                addMessage(botResponse, 'bot');
            }, 1000 + Math.random() * 2000);
        }
    }
    
    // Send on button click
    chatbotSend.addEventListener('click', sendMessage);
    
    // Send on Enter key
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender + '-message');
        
        const messageText = document.createElement('p');
        messageText.textContent = text;
        
        messageDiv.appendChild(messageText);
        chatbotMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typingIndicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('typing-dot');
            typingDiv.appendChild(dot);
        }
        
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Simple bot response logic
    function generateBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Order status
        if (lowerMessage.includes('order') && (lowerMessage.includes('status') || lowerMessage.includes('track'))) {
            return "You can check your order status in your account dashboard or by clicking here: [Order Tracking]";
        }
        
        // Returns
        else if (lowerMessage.includes('return') || lowerMessage.includes('exchange')) {
            return "We have a 30-day return policy. Items must be unworn with tags attached. Learn more in our Returns Policy.";
        }
        
        // Sizing
        else if (lowerMessage.includes('size') || lowerMessage.includes('fit')) {
            return "You can find our detailed size guide here: [Size Guide]. If you're between sizes, we recommend sizing up.";
        }
        
        // Shipping
        else if (lowerMessage.includes('ship') || lowerMessage.includes('delivery')) {
            return "We offer standard (3-5 days) and express (1-2 days) shipping in India. International shipping takes 7-14 days.";
        }
        
        // Contact
        else if (lowerMessage.includes('contact') || lowerMessage.includes('help')) {
            return "You can reach our customer service team at support@kamiwear.com or +91 9253395564 (Mon-Fri 9AM-6PM).";
        }
        
        // Default responses
        const defaultResponses = [
            "I'm happy to help with any questions about our anime fashion collection!",
            "Could you please provide more details about your question?",
            "I specialize in KamiWear products and policies. What would you like to know?",
            "Check out our new Demon Slayer collection - it's very popular right now!",
            "I'm not sure I understand. Could you rephrase your question?"
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
});