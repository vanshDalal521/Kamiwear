// Network module for KamiWear

// Network class for handling API requests
export class Network {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Set base URL
    setBaseURL(url) {
        this.baseURL = url;
    }

    // Set default headers
    setDefaultHeaders(headers) {
        this.defaultHeaders = {
            ...this.defaultHeaders,
            ...headers
        };
    }

    // Get request
    async get(endpoint, params = {}, headers = {}) {
        try {
            const url = new URL(this.baseURL + endpoint);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making GET request:', error);
            throw error;
        }
    }

    // Post request
    async post(endpoint, data = {}, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'POST',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making POST request:', error);
            throw error;
        }
    }

    // Put request
    async put(endpoint, data = {}, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'PUT',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making PUT request:', error);
            throw error;
        }
    }

    // Delete request
    async delete(endpoint, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'DELETE',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making DELETE request:', error);
            throw error;
        }
    }

    // Patch request
    async patch(endpoint, data = {}, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'PATCH',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making PATCH request:', error);
            throw error;
        }
    }

    // Upload file
    async upload(endpoint, file, headers = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(this.baseURL + endpoint, {
                method: 'POST',
                headers: {
                    ...headers
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // Download file
    async download(endpoint, filename, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'GET',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    }

    // Stream data
    async stream(endpoint, onData, onError, headers = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'GET',
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {value, done} = await reader.read();
                if (done) break;
                const data = decoder.decode(value);
                onData(data);
            }
        } catch (error) {
            console.error('Error streaming data:', error);
            onError(error);
        }
    }

    // WebSocket connection
    connect(endpoint, onMessage, onError, onClose) {
        try {
            const ws = new WebSocket(this.baseURL + endpoint);

            ws.onmessage = (event) => {
                onMessage(JSON.parse(event.data));
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                onError(error);
            };

            ws.onclose = () => {
                onClose();
            };

            return ws;
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            throw error;
        }
    }

    // Send WebSocket message
    send(ws, data) {
        try {
            ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            throw error;
        }
    }

    // Close WebSocket connection
    close(ws) {
        try {
            ws.close();
        } catch (error) {
            console.error('Error closing WebSocket connection:', error);
            throw error;
        }
    }

    // Check if online
    isOnline() {
        return navigator.onLine;
    }

    // Add online event listener
    onOnline(callback) {
        window.addEventListener('online', callback);
    }

    // Add offline event listener
    onOffline(callback) {
        window.addEventListener('offline', callback);
    }

    // Remove online event listener
    offOnline(callback) {
        window.removeEventListener('online', callback);
    }

    // Remove offline event listener
    offOffline(callback) {
        window.removeEventListener('offline', callback);
    }
}

// Create network instance
const network = new Network();

// Export network instance
export default network; 