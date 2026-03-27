import { useNavigate } from 'react-router';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080D13] text-slate-100">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="text-slate-400">You do not have permission to access this page.</p>
      <button className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
