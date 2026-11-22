import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const call = (name) => async (data) => (await httpsCallable(functions, name)(data)).data;

export const holdSeats = call('holdSeats');
export const cancelOrder = call('cancelOrder');
export const createCheckout = call('createCheckout');
export const verifyPayment = call('verifyPayment');
export const simulateMockPayment = call('simulateMockPayment');
export const validateTicket = call('validateTicket');
export const requestRefund = call('requestRefund');
export const decideRefund = call('decideRefund');
export const saveMatch = call('saveMatch');
export const publishMatch = call('publishMatch');
export const cancelMatch = call('cancelMatch');
export const transferTicket = call('transferTicket');
