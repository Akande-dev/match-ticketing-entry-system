// One small function per Cloud Function, so screens never build function calls themselves.

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Turns a function name into an async function that sends data and returns the result.
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

export const listUsers = call('listUsers');
export const setUserRole = call('setUserRole');
export const setUserDisabled = call('setUserDisabled');
