const User = require('../models/userModel');
const Order = require('../models/orderModel');
const { isMongoReady } = require('./db');

let indexPromise = null;

/**
 * Create the indexes that enforce correctness, not just performance:
 * unique email, unique idempotency key, unique UTR and unique transaction id.
 * Called once per server process after MongoDB is connected.
 */
function ensureIndexes() {
    if (!isMongoReady()) return Promise.resolve(false);

    if (!indexPromise) {
        indexPromise = Promise.all([User.ensureIndexes(), Order.ensureIndexes()])
            .then(() => {
                console.log('[Kamiwear Backend] MongoDB indexes are ready.');
                return true;
            })
            .catch(error => {
                indexPromise = null;
                console.error('[Kamiwear Backend] Could not create MongoDB indexes:', error.message);
                return false;
            });
    }

    return indexPromise;
}

module.exports = { ensureIndexes };
