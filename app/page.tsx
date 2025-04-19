import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-10">
      <h2 className="text-2xl font-semibold mb-6">Welcome to Flash</h2>
      <p className="mb-8">Start your merchant signup process to accept payments with Flash.</p>
      
      <Link 
        href="/form" 
        className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        Start Signup
      </Link>
    </div>
  );
}
