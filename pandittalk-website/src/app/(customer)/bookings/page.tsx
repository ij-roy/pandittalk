import type { Metadata } from 'next';
import {BookingList} from '@/features/bookings/BookingViews';

export const metadata: Metadata = { title: 'Bookings', description: 'Upcoming and past consultations on Pandit Talk.' };
export default function Page(){return <BookingList/>;}

