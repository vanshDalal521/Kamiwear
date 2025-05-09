// Validation module for KamiWear

// Form validation class
export class FormValidator {
    constructor(form, rules) {
        this.form = form;
        this.rules = rules;
        this.errors = {};
        this.initializeValidation();
    }

    initializeValidation() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validate()) {
                this.form.submit();
            }
        });

        // Add input event listeners for real-time validation
        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('input', () => {
                    this.validateField(fieldName);
                });
                field.addEventListener('blur', () => {
                    this.validateField(fieldName);
                });
            }
        });
    }

    validate() {
        let isValid = true;
        this.errors = {};

        Object.keys(this.rules).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const value = field.value.trim();
        const rules = this.rules[fieldName];
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (isValid && rules.email && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Password validation
        if (isValid && rules.password && !this.isValidPassword(value)) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers';
        }

        // Min length validation
        if (isValid && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `This field must be at least ${rules.minLength} characters long`;
        }

        // Max length validation
        if (isValid && rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = `This field must not exceed ${rules.maxLength} characters`;
        }

        // Pattern validation
        if (isValid && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.patternMessage || 'Please enter a valid value';
        }

        // Custom validation
        if (isValid && rules.custom) {
            const customValidation = rules.custom(value);
            if (typeof customValidation === 'string') {
                isValid = false;
                errorMessage = customValidation;
            }
        }

        // Update error state
        this.updateErrorState(field, isValid, errorMessage);

        return isValid;
    }

    updateErrorState(field, isValid, errorMessage) {
        const errorElement = field.parentElement.querySelector('.error-message');
        
        if (!isValid) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
            } else {
                const newErrorElement = document.createElement('div');
                newErrorElement.className = 'error-message';
                newErrorElement.textContent = errorMessage;
                field.parentElement.appendChild(newErrorElement);
            }
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isValidPassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return re.test(password);
    }

    isValidPhone(phone) {
        const re = /^\+?[\d\s-]{10,}$/;
        return re.test(phone);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    isValidNumber(number) {
        return !isNaN(number) && isFinite(number);
    }

    isValidInteger(number) {
        return this.isValidNumber(number) && Number.isInteger(Number(number));
    }

    isValidFloat(number) {
        return this.isValidNumber(number) && !Number.isInteger(Number(number));
    }

    isValidRange(number, min, max) {
        return this.isValidNumber(number) && number >= min && number <= max;
    }

    isValidLength(value, min, max) {
        return value.length >= min && value.length <= max;
    }

    isValidPattern(value, pattern) {
        return pattern.test(value);
    }

    isValidMatch(value1, value2) {
        return value1 === value2;
    }

    isValidCreditCard(number) {
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        
        // Loop through values starting from the rightmost
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    isValidPostalCode(code, country = 'US') {
        const patterns = {
            US: /^\d{5}(-\d{4})?$/,
            UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
            CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i
        };

        return patterns[country]?.test(code) || false;
    }

    isValidSSN(ssn) {
        const re = /^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$/;
        return re.test(ssn);
    }

    isValidIP(ip) {
        const re = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return re.test(ip);
    }

    isValidHexColor(color) {
        const re = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return re.test(color);
    }

    isValidRGBColor(color) {
        const re = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
        return re.test(color);
    }

    isValidHSLColor(color) {
        const re = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
        return re.test(color);
    }
}

// Validation rules
export const validationRules = {
    // Common rules
    required: {
        required: true
    },
    email: {
        required: true,
        email: true
    },
    password: {
        required: true,
        password: true
    },
    phone: {
        required: true,
        pattern: /^\+?[\d\s-]{10,}$/,
        patternMessage: 'Please enter a valid phone number'
    },
    url: {
        required: true,
        pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
        patternMessage: 'Please enter a valid URL'
    },
    date: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        patternMessage: 'Please enter a valid date (YYYY-MM-DD)'
    },
    number: {
        required: true,
        pattern: /^-?\d*\.?\d+$/,
        patternMessage: 'Please enter a valid number'
    },
    integer: {
        required: true,
        pattern: /^-?\d+$/,
        patternMessage: 'Please enter a valid integer'
    },
    float: {
        required: true,
        pattern: /^-?\d*\.\d+$/,
        patternMessage: 'Please enter a valid decimal number'
    },
    range: {
        required: true,
        pattern: /^-?\d*\.?\d+$/,
        patternMessage: 'Please enter a valid number',
        custom: (value) => {
            const num = Number(value);
            if (num < 0 || num > 100) {
                return 'Please enter a number between 0 and 100';
            }
            return true;
        }
    },
    length: {
        required: true,
        minLength: 3,
        maxLength: 50
    },
    pattern: {
        required: true,
        pattern: /^[A-Za-z0-9]+$/,
        patternMessage: 'Please enter only letters and numbers'
    },
    match: {
        required: true,
        custom: (value) => {
            const password = document.querySelector('[name="password"]')?.value;
            if (value !== password) {
                return 'Passwords do not match';
            }
            return true;
        }
    },
    creditCard: {
        required: true,
        pattern: /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/,
        patternMessage: 'Please enter a valid credit card number'
    },
    postalCode: {
        required: true,
        pattern: /^\d{5}(-\d{4})?$/,
        patternMessage: 'Please enter a valid postal code'
    },
    ssn: {
        required: true,
        pattern: /^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$/,
        patternMessage: 'Please enter a valid SSN'
    },
    ip: {
        required: true,
        pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        patternMessage: 'Please enter a valid IP address'
    },
    hexColor: {
        required: true,
        pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        patternMessage: 'Please enter a valid hex color'
    },
    rgbColor: {
        required: true,
        pattern: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
        patternMessage: 'Please enter a valid RGB color'
    },
    hslColor: {
        required: true,
        pattern: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/,
        patternMessage: 'Please enter a valid HSL color'
    }
}; 