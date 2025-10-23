import { useState, useEffect } from "react";

export default function Settings() {
  const [user, setUser] = useState({
    username: "",
    display_name: "",
    email: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/users/1")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to load user:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const res = await fetch("http://localhost:3001/api/users/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    setMessage(res.ok ? "✅ Profile updated!" : "❌ Failed to save changes.");
  };

  if (loading) return <p>Loading user info...</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Settings</h1>

      <label className="block mb-2 font-semibold">Display Name</label>
      <input className="border p-2 w-full mb-4" name="display_name" value={user.display_name} onChange={handleChange} />

      <label className="block mb-2 font-semibold">Email</label>
      <input className="border p-2 w-full mb-4" name="email" value={user.email} onChange={handleChange} />

      <label className="block mb-2 font-semibold">Bio</label>
      <textarea className="border p-2 w-full mb-4" name="bio" rows={3} value={user.bio} onChange={handleChange} />

      <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={handleSave}>
        Save Changes
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
