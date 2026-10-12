import { redirect } from 'next/navigation';

// דף הפתיחה של האפליקציה הוא המצגת
export default function Home() {
  redirect('/tour');
}
