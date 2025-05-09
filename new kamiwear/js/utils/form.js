// Form module for KamiWear

// Form class for handling form functionality
export class Form {
    constructor() {
        this.forms = new Map();
        this.initializeForms();
    }

    initializeForms() {
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                this.initializeForm(form);
            });
        });
    }

    initializeForm(form) {
        const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
        form.id = formId;
        this.forms.set(formId, form);

        // Add form validation
        this.addFormValidation(form);

        // Add form submission
        this.addFormSubmission(form);

        // Add form reset
        this.addFormReset(form);

        // Add form field events
        this.addFormFieldEvents(form);
    }

    addFormValidation(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            field.addEventListener('input', () => {
                this.validateField(field);
            });
        });
    }

    addFormSubmission(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm(form)) {
                this.submitForm(form);
            }
        });
    }

    addFormReset(form) {
        const resetButton = form.querySelector('button[type="reset"]');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetForm(form);
            });
        }
    }

    addFormFieldEvents(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            // Focus event
            field.addEventListener('focus', () => {
                this.handleFieldFocus(field);
            });

            // Blur event
            field.addEventListener('blur', () => {
                this.handleFieldBlur(field);
            });

            // Change event
            field.addEventListener('change', () => {
                this.handleFieldChange(field);
            });

            // Input event
            field.addEventListener('input', () => {
                this.handleFieldInput(field);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (isValid && field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Password validation
        if (isValid && field.type === 'password' && value) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
            if (!passwordRegex.test(value)) {
                isValid = false;
                errorMessage = 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers';
            }
        }

        // Number validation
        if (isValid && field.type === 'number' && value) {
            const number = Number(value);
            if (isNaN(number)) {
                isValid = false;
                errorMessage = 'Please enter a valid number';
            } else {
                if (field.min && number < Number(field.min)) {
                    isValid = false;
                    errorMessage = `Please enter a number greater than or equal to ${field.min}`;
                }
                if (field.max && number > Number(field.max)) {
                    isValid = false;
                    errorMessage = `Please enter a number less than or equal to ${field.max}`;
                }
            }
        }

        // URL validation
        if (isValid && field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL';
            }
        }

        // Pattern validation
        if (isValid && field.pattern && value) {
            const pattern = new RegExp(field.pattern);
            if (!pattern.test(value)) {
                isValid = false;
                errorMessage = field.title || 'Please enter a valid value';
            }
        }

        // Min length validation
        if (isValid && field.minLength && value.length < Number(field.minLength)) {
            isValid = false;
            errorMessage = `Please enter at least ${field.minLength} characters`;
        }

        // Max length validation
        if (isValid && field.maxLength && value.length > Number(field.maxLength)) {
            isValid = false;
            errorMessage = `Please enter no more than ${field.maxLength} characters`;
        }

        // Custom validation
        if (isValid && field.dataset.validate) {
            const validateFunction = window[field.dataset.validate];
            if (typeof validateFunction === 'function') {
                const result = validateFunction(value);
                if (typeof result === 'string') {
                    isValid = false;
                    errorMessage = result;
                }
            }
        }

        // Update field state
        this.updateFieldState(field, isValid, errorMessage);

        return isValid;
    }

    validateForm(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    submitForm(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Trigger form submission event
        const event = new CustomEvent('formSubmit', {
            detail: {
                form,
                data
            }
        });
        form.dispatchEvent(event);

        // Submit form data
        if (form.action) {
            fetch(form.action, {
                method: form.method || 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Trigger form success event
                const event = new CustomEvent('formSuccess', {
                    detail: {
                        form,
                        data
                    }
                });
                form.dispatchEvent(event);
            })
            .catch(error => {
                // Trigger form error event
                const event = new CustomEvent('formError', {
                    detail: {
                        form,
                        error
                    }
                });
                form.dispatchEvent(event);
            });
        }
    }

    resetForm(form) {
        form.reset();
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            this.updateFieldState(field, true);
        });

        // Trigger form reset event
        const event = new CustomEvent('formReset', {
            detail: {
                form
            }
        });
        form.dispatchEvent(event);
    }

    updateFieldState(field, isValid, errorMessage = '') {
        const container = field.closest('.form-group');
        if (container) {
            const errorElement = container.querySelector('.error-message');
            
            if (!isValid) {
                field.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = errorMessage;
                } else {
                    const newErrorElement = document.createElement('div');
                    newErrorElement.className = 'error-message';
                    newErrorElement.textContent = errorMessage;
                    container.appendChild(newErrorElement);
                }
            } else {
                field.classList.remove('error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        }
    }

    handleFieldFocus(field) {
        field.classList.add('focused');
    }

    handleFieldBlur(field) {
        field.classList.remove('focused');
    }

    handleFieldChange(field) {
        field.classList.add('changed');
    }

    handleFieldInput(field) {
        field.classList.add('dirty');
    }

    // Form utility methods
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    setFormData(form, data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
            }
        });
    }

    clearFormData(form) {
        form.reset();
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.value = '';
            field.classList.remove('dirty', 'changed', 'error', 'focused');
        });
    }

    disableForm(form) {
        const fields = form.querySelectorAll('input, select, textarea, button');
        fields.forEach(field => {
            field.disabled = true;
        });
    }

    enableForm(form) {
        const fields = form.querySelectorAll('input, select, textarea, button');
        fields.forEach(field => {
            field.disabled = false;
        });
    }

    showFormErrors(form, errors) {
        Object.entries(errors).forEach(([key, message]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                this.updateFieldState(field, false, message);
            }
        });
    }

    clearFormErrors(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            this.updateFieldState(field, true);
        });
    }
}

// Create form instance
const form = new Form();

// Export form instance
export default form; 