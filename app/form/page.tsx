import SignupForm from './components/SignupForm';

export default function FormPage() {
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Create your account</h2>
        <p className="text-gray-500 text-sm">Complete the form below to get started with Flash</p>
      </div>
      <SignupForm />
    </div>
  );
}
