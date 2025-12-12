

import { db } from './firebase-config.js';
import { ref, get, set, push, update, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
const POINTS_PER_SHIRT = 10;
const MAX_POINTS_PER_TRANSACTION = 1000;
const REWARDS = [
    { id: 'discount_10', name: '10% Descuento', type: 'percentage', value: 10, cost: 20, description: '10% de descuento en tu próxima compra' },
    { id: 'discount_15', name: '15% Descuento', type: 'percentage', value: 15, cost: 40, description: '15% de descuento en tu próxima compra' },
    { id: 'discount_20', name: '20% Descuento', type: 'percentage', value: 20, cost: 60, description: '20% de descuento en tu próxima compra' },
    { id: 'free_shirt', name: 'Camiseta Gratis', type: 'fixed', value: 19.90, cost: 100, description: 'Camiseta gratis (19,90€). Extras se pagan aparte.' }
];


export async function loadUserPoints(uid) {
    if (!uid) return { pendingPoints: 0, availablePoints: 0 };

    try {
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            return {
                pendingPoints: data.pendingPoints || 0,
                availablePoints: data.availablePoints || 0
            };
        }

        return { pendingPoints: 0, availablePoints: 0 };
    } catch (error) {
        console.error('Error loading user points:', error);
        return { pendingPoints: 0, availablePoints: 0 };
    }
}


export async function loadPointsHistory(uid) {
    if (!uid) return [];

    try {
        const historyRef = ref(db, `users/${uid}/pointsHistory`);
        const snapshot = await get(historyRef);

        if (snapshot.exists()) {
            const historyObj = snapshot.val();
            return Object.entries(historyObj)
                .map(([id, entry]) => ({ id, ...entry }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        return [];
    } catch (error) {
        console.error('Error loading points history:', error);
        return [];
    }
}


export async function addPendingPoints(uid, orderId, shirtQuantity) {
    if (!uid || !orderId || shirtQuantity <= 0) return false;

    const pointsToAdd = shirtQuantity * POINTS_PER_SHIRT;
    if (pointsToAdd > MAX_POINTS_PER_TRANSACTION) {
        console.warn('Points exceed max transaction limit');
        return false;
    }

    try {
        const orderPointsRef = ref(db, `users/${uid}/pointsByOrder/${orderId}`);
        const existingSnapshot = await get(orderPointsRef);

        if (existingSnapshot.exists()) {
            return false;
        }
        const userRef = ref(db, `users/${uid}`);
        const userSnapshot = await get(userRef);
        const currentPending = userSnapshot.exists() ? (userSnapshot.val().pendingPoints || 0) : 0;
        const updates = {};
        updates[`users/${uid}/pendingPoints`] = currentPending + pointsToAdd;
        updates[`users/${uid}/pointsByOrder/${orderId}`] = {
            points: pointsToAdd,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        const historyRef = ref(db, `users/${uid}/pointsHistory`);
        const newHistoryRef = push(historyRef);
        updates[`users/${uid}/pointsHistory/${newHistoryRef.key}`] = {
            type: 'earned_pending',
            points: pointsToAdd,
            orderId: orderId,
            timestamp: new Date().toISOString(),
            description: `+${pointsToAdd} puntos pendientes (${shirtQuantity} camiseta${shirtQuantity > 1 ? 's' : ''})`
        };

        await update(ref(db), updates);
        return true;

    } catch (error) {
        console.error('Error adding pending points:', error);
        return false;
    }
}


export async function convertToAvailable(uid, orderId) {
    if (!uid || !orderId) return false;

    try {
        const orderPointsRef = ref(db, `users/${uid}/pointsByOrder/${orderId}`);
        const orderSnapshot = await get(orderPointsRef);

        if (!orderSnapshot.exists()) {
            return false;
        }

        const orderPoints = orderSnapshot.val();

        if (orderPoints.status === 'available') {
            return false;
        }

        const pointsToConvert = orderPoints.points;
        const userRef = ref(db, `users/${uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        const currentPending = userData.pendingPoints || 0;
        const currentAvailable = userData.availablePoints || 0;
        const updates = {};
        updates[`users/${uid}/pendingPoints`] = Math.max(0, currentPending - pointsToConvert);
        updates[`users/${uid}/availablePoints`] = currentAvailable + pointsToConvert;
        updates[`users/${uid}/pointsByOrder/${orderId}/status`] = 'available';
        updates[`users/${uid}/pointsByOrder/${orderId}/convertedAt`] = new Date().toISOString();
        const historyRef = ref(db, `users/${uid}/pointsHistory`);
        const newHistoryRef = push(historyRef);
        updates[`users/${uid}/pointsHistory/${newHistoryRef.key}`] = {
            type: 'converted',
            points: pointsToConvert,
            orderId: orderId,
            timestamp: new Date().toISOString(),
            description: `+${pointsToConvert} puntos ahora disponibles`
        };

        await update(ref(db), updates);
        return true;

    } catch (error) {
        console.error('Error converting points:', error);
        return false;
    }
}


export async function redeemCoupon(uid, rewardId) {
    if (!uid || !rewardId) return null;

    const reward = REWARDS.find(r => r.id === rewardId);
    if (!reward) {
        console.error('Invalid reward ID');
        return null;
    }

    try {
        const userRef = ref(db, `users/${uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        const currentAvailable = userData.availablePoints || 0;
        if (currentAvailable < reward.cost) {
            console.error('Insufficient points');
            return null;
        }
        const couponId = `CPN-${Date.now()}`;
        const coupon = {
            type: reward.type,
            value: reward.value,
            pointsCost: reward.cost,
            rewardName: reward.name,
            description: reward.description,
            used: false,
            createdAt: new Date().toISOString()
        };
        const updates = {};
        updates[`users/${uid}/availablePoints`] = currentAvailable - reward.cost;
        updates[`users/${uid}/coupons/${couponId}`] = coupon;
        const historyRef = ref(db, `users/${uid}/pointsHistory`);
        const newHistoryRef = push(historyRef);
        updates[`users/${uid}/pointsHistory/${newHistoryRef.key}`] = {
            type: 'redeemed',
            points: -reward.cost,
            couponId: couponId,
            timestamp: new Date().toISOString(),
            description: `-${reward.cost} puntos canjeados por ${reward.name}`
        };

        await update(ref(db), updates);
        return { id: couponId, ...coupon };

    } catch (error) {
        console.error('Error redeeming coupon:', error);
        return null;
    }
}


export async function getUserCoupons(uid) {
    if (!uid) return [];

    try {
        const couponsRef = ref(db, `users/${uid}/coupons`);
        const snapshot = await get(couponsRef);

        if (snapshot.exists()) {
            const couponsObj = snapshot.val();
            return Object.entries(couponsObj)
                .map(([id, coupon]) => ({ id, ...coupon }))
                .filter(coupon => !coupon.used)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return [];
    } catch (error) {
        console.error('Error loading coupons:', error);
        return [];
    }
}


export async function useCoupon(uid, couponId, orderId) {
    if (!uid || !couponId || !orderId) return false;

    try {
        const couponRef = ref(db, `users/${uid}/coupons/${couponId}`);
        const snapshot = await get(couponRef);

        if (!snapshot.exists()) {
            console.error('Coupon not found');
            return false;
        }

        const coupon = snapshot.val();
        if (coupon.used) {
            console.error('Coupon already used');
            return false;
        }
        await update(couponRef, {
            used: true,
            usedAt: new Date().toISOString(),
            usedInOrder: orderId
        });
        return true;

    } catch (error) {
        console.error('Error using coupon:', error);
        return false;
    }
}

export { REWARDS, POINTS_PER_SHIRT };

const PointsSystem = {
    REWARDS,
    POINTS_PER_SHIRT,
    loadUserPoints,
    loadPointsHistory,
    addPendingPoints,
    convertToAvailable,
    redeemCoupon,
    getUserCoupons,
    useCoupon
};

export default PointsSystem;
