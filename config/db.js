const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser and useUnifiedTopology are deprecated in newer mongoose versions and no longer needed
        });
        console.log(`[Kamiwear Backend] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Kamiwear Backend] Error connecting to MongoDB: ${error.message}`);
        // gracefully continue without db so the app doesn't crash completely, but things will fail later
    }
};

module.exports = connectDB;
