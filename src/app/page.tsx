export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Mahima Academy</h1>
      <p className="mt-4">Welcome to the student portal.</p>
      <a href="/admin/upload" className="mt-4 text-blue-500 underline">
        Go to Admin Upload
      </a>
    </div>
  );
}